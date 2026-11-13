import type { DB } from '@op-engineering/op-sqlite';
import type { Employee } from '../../types/domain';

interface EmployeeRow { id: string; name: string; department: string; }

export class EmployeeRepository {
  constructor(private readonly db: DB) {}

  async getEmployee(): Promise<Employee | null> {
    const result = await this.db.execute('SELECT id, name, department FROM employees LIMIT 1');
    const row = result.rows[0] as unknown as EmployeeRow | undefined;
    return row ?? null;
  }

  async saveEmployee(employee: Employee): Promise<void> {
    await this.db.execute(
      'INSERT INTO employees (id, name, department) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, department = excluded.department',
      [employee.id, employee.name, employee.department],
    );
  }
}
