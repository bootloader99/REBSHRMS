import { open } from '@op-engineering/op-sqlite';

export const database = open({ name: 'rebs_hrms.sqlite' });
