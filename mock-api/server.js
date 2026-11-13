const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const COMPANY_TIME_ZONE = process.env.COMPANY_TIME_ZONE || 'Asia/Kolkata';

function companyDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: COMPANY_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
const STORE_PATH = path.join(__dirname, 'store.json');
const DEFAULT_STORE = {
  employee: { id: 'EMP-001', name: 'Alex Morgan', department: 'Product & Engineering' },
  leaveBalance: { casual: 8, sick: 6 },
  attendanceEvents: [],
  leaveRequests: [],
  idempotency: {},
};

function loadStore() {
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2));
  }
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
}

function saveStore(store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 100000) reject(new Error('Request body is too large.'));
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error('Request body must be valid JSON.')); }
    });
    req.on('error', reject);
  });
}

function dateIsValid(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(value + 'T00:00:00Z'))
    && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && aEnd >= bStart;
}

function daysInclusive(start, end) {
  return Math.floor((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
}

async function handle(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const scenario = String(req.headers['x-mock-scenario'] || process.env.MOCK_SCENARIO || 'success');

  if (scenario === 'server-error') {
    return send(res, 500, { code: 'MOCK_SERVER_ERROR', message: 'Simulated server error.' });
  }

  const store = loadStore();

  if (req.method === 'GET' && url.pathname === '/employee/me') {
    if (scenario === 'slow') await new Promise(resolve => setTimeout(resolve, 12000));
    return send(res, 200, store.employee);
  }

  if (req.method === 'GET' && url.pathname === '/attendance') {
    if (scenario === 'slow') await new Promise(resolve => setTimeout(resolve, 12000));
    const month = url.searchParams.get('month');
    const days = new Map();
    for (const event of store.attendanceEvents) {
      if (month && !event.workDate.startsWith(month)) continue;
      const day = days.get(event.workDate) || {
        workDate: event.workDate, checkInAt: null, checkOutAt: null, status: 'not_checked_in',
      };
      if (event.eventType === 'check_in') {
        day.checkInAt = event.occurredAt;
        day.status = 'checked_in';
      }
      if (event.eventType === 'check_out') {
        day.checkOutAt = event.occurredAt;
        day.status = 'checked_out';
      }
      days.set(event.workDate, day);
    }
    return send(res, 200, Array.from(days.values()).sort((a, b) => b.workDate.localeCompare(a.workDate)));
  }

  if (req.method === 'POST' && url.pathname === '/attendance/events') {
    let body;
    try { body = await readBody(req); }
    catch (error) { return send(res, 400, { code: 'INVALID_JSON', message: error.message }); }

    const key = String(req.headers['idempotency-key'] || body.id || '');
    if (!key || key !== body.id) {
      return send(res, 400, { code: 'MISSING_IDEMPOTENCY_KEY', message: 'A stable event ID is required.' });
    }

    if (store.idempotency[key]) {
      return send(res, 200, { accepted: true, duplicate: true, event: store.idempotency[key] });
    }

    if (scenario === 'duplicate-conflict') {
      return send(res, 409, { code: 'DUPLICATE_CONFLICT', message: 'Simulated duplicate attendance conflict.' });
    }

    const duplicate = store.attendanceEvents.find(event =>
      event.employeeId === body.employeeId
      && event.workDate === body.workDate
      && event.eventType === body.eventType
    );
    if (duplicate) {
      return send(res, 409, { code: 'ATTENDANCE_ALREADY_RECORDED', message: 'This attendance action has already been recorded for the day.' });
    }

    if (body.eventType === 'check_out') {
      const checkIn = store.attendanceEvents.find(event =>
        event.employeeId === body.employeeId && event.workDate === body.workDate && event.eventType === 'check_in'
      );
      if (!checkIn) {
        return send(res, 409, { code: 'CHECK_IN_REQUIRED', message: 'A check-in is required before check-out.' });
      }
    }

    const accepted = { ...body, receivedAt: new Date().toISOString() };
    store.attendanceEvents.push(accepted);
    store.idempotency[key] = accepted;
    saveStore(store);

    if (scenario === 'timeout-after-accept') {
      await new Promise(resolve => setTimeout(resolve, 12000));
    }
    return send(res, 200, { accepted: true, duplicate: false, event: accepted });
  }

  if (req.method === 'GET' && url.pathname === '/leave/balance') {
    if (scenario === 'slow') await new Promise(resolve => setTimeout(resolve, 12000));
    return send(res, 200, store.leaveBalance);
  }

  if (req.method === 'GET' && url.pathname === '/leave/requests') {
    if (scenario === 'slow') await new Promise(resolve => setTimeout(resolve, 12000));
    return send(res, 200, store.leaveRequests);
  }

  if (req.method === 'POST' && url.pathname === '/leave/requests') {
    let body;
    try { body = await readBody(req); }
    catch (error) { return send(res, 400, { code: 'INVALID_JSON', message: error.message }); }

    if (scenario === 'leave-reject') {
      return send(res, 422, { code: 'LEAVE_REJECTED', message: 'Simulated server-side leave validation rejection.' });
    }

    if (!['casual', 'sick'].includes(body.type)
      || !dateIsValid(body.startDate)
      || !dateIsValid(body.endDate)
      || body.endDate < body.startDate
      || typeof body.reason !== 'string'
      || !body.reason.trim()) {
      return send(res, 422, { code: 'INVALID_LEAVE_REQUEST', message: 'The leave request details are invalid.' });
    }

    const today = companyDate();
    if (body.startDate < today) {
      return send(res, 422, { code: 'PAST_LEAVE_DATE', message: 'Leave cannot start before today.' });
    }

    const existing = store.leaveRequests.find(request =>
      request.status !== 'rejected'
      && overlaps(body.startDate, body.endDate, request.startDate, request.endDate)
    );
    if (existing) {
      return send(res, 422, { code: 'LEAVE_OVERLAP', message: 'This period overlaps an existing request.' });
    }

    const days = daysInclusive(body.startDate, body.endDate);
    if (days > store.leaveBalance[body.type]) {
      return send(res, 422, { code: 'INSUFFICIENT_BALANCE', message: `You have only ${store.leaveBalance[body.type]} days of this leave type available, but selected ${days} days.` });
    }

    const request = {
      id: body.id || `leave-${Date.now()}`,
      type: body.type,
      startDate: body.startDate,
      endDate: body.endDate,
      reason: body.reason.trim(),
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    store.leaveRequests.push(request);
    saveStore(store);
    return send(res, 201, request);
  }

  return send(res, 404, { code: 'NOT_FOUND', message: 'Endpoint not found.' });
}

http.createServer((req, res) => {
  handle(req, res).catch(error => {
    console.error(error);
    if (!res.headersSent) send(res, 500, { code: 'INTERNAL_ERROR', message: 'Unexpected mock API error.' });
  });
}).listen(PORT, '0.0.0.0', () => {
  console.log(`REBS HRMS mock API listening on http://0.0.0.0:${PORT}`);
});
