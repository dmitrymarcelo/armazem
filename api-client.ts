const AUTH_TOKEN_KEY = 'auth_token';

const getData = (key: string): any[] => {
  try {
    const data = localStorage.getItem(`logiwms_${key}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const setData = (key: string, data: any[]) => {
  try {
    localStorage.setItem(`logiwms_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving:', e);
  }
};

// Init mock data
const initData = () => {
  if (!localStorage.getItem('logiwms_warehouses')) {
    setData('warehouses', [
      { id: 'ARMZ28', name: 'CD Manaus', description: 'Centro Manaus', location: 'Manaus - AM', is_active: true, manager_name: 'João', manager_email: 'joao@logiwms.com' },
      { id: 'ARMZ33', name: 'CD São Paulo', description: 'Centro SP', location: 'São Paulo - SP', is_active: true, manager_name: 'Maria', manager_email: 'maria@logiwms.com' }
    ]);
    setData('inventory', [
      { sku: 'SKU-000028', name: 'Item Teste 28', location: 'A-01-01', batch: 'B001', expiry: '2026-12-31', quantity: 50, status: 'disponivel', image_url: '', category: 'Teste', unit: 'UN', min_qty: 10, max_qty: 100, lead_time: 7, safety_stock: 5, warehouse_id: 'ARMZ28' },
      { sku: 'SKU-000030', name: 'Item Teste 30', location: 'A-01-02', batch: 'B002', expiry: '2026-12-31', quantity: 25, status: 'disponivel', image_url: '', category: 'Teste', unit: 'UN', min_qty: 5, max_qty: 50, lead_time: 7, safety_stock: 5, warehouse_id: 'ARMZ28' },
      { sku: 'OLEO-15W40', name: 'Óleo Motor', location: 'C-01-01', batch: 'B004', expiry: '2027-06-30', quantity: 200, status: 'disponivel', image_url: '', category: 'Óleo', unit: 'L', min_qty: 50, max_qty: 500, lead_time: 10, safety_stock: 25, warehouse_id: 'ARMZ28' }
    ]);
    setData('vehicles', [
      { plate: 'BGM-1001', model: 'Volvo FH 540', type: 'Caminhão', status: 'Disponível', last_maintenance: '15/01/2026', cost_center: 'OPS-CD' },
      { plate: 'CHN-1002', model: 'Mercedes', type: 'Carreta', status: 'Disponível', last_maintenance: '20/01/2026', cost_center: 'MAN-OFI' }
    ]);
    setData('material_requests', [
      { id: 'REQ-6037', sku: 'SKU-000028', name: 'Item Teste 28', qty: 2, plate: 'BGM-1001', dept: 'OF-OPERAÇÕES', priority: 'normal', status: 'aprovacao', created_at: new Date().toISOString(), cost_center: 'OPS-CD', warehouse_id: 'ARMZ28' },
      { id: 'REQ-TEST-000041', sku: 'SKU-000030', name: 'Item Teste 30', qty: 1, plate: 'CHN-1002', dept: 'MAN-OFICINA', priority: 'alta', status: 'separacao', created_at: new Date().toISOString(), cost_center: 'MAN-OFI', warehouse_id: 'ARMZ28' }
    ]);
    setData('users', [
      { id: 'admin', name: 'Administrador', email: 'admin@logiwms.com', role: 'admin', status: 'active', modules: ['warehouse'], allowed_warehouses: ['ARMZ28'], password: 'admin' },
      { id: 'oper', name: 'Operador', email: 'oper@logiwms.com', role: 'operador', status: 'active', modules: ['warehouse'], allowed_warehouses: ['ARMZ28'], password: 'oper' }
    ]);
    setData('movements', []);
    setData('purchase_orders', []);
  }
};

if (typeof window !== 'undefined') {
  initData();
}

class ApiClient {
  private table = '';
  private queryParams: Record<string, string> = {};
  private method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
  private bodyData: any = null;
  private authToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.authToken = window.localStorage.getItem(AUTH_TOKEN_KEY);
    }
  }

  from(table: string) {
    this.table = table;
    this.queryParams = {};
    this.method = 'GET';
    this.bodyData = null;
    return this;
  }

  select(_cols?: string) {
    this.method = 'GET';
    return this;
  }

  eq(column: string, value: any) {
    this.queryParams[column] = String(value);
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.queryParams.order = `${column}:${opts?.ascending ? 'asc' : 'desc'}`;
    return this;
  }

  limit(n: number) {
    this.queryParams.limit = String(n);
    return this;
  }

  offset(n: number) {
    this.queryParams.offset = String(Math.max(0, n));
    return this;
  }

  insert(data: any) {
    this.method = 'POST';
    this.bodyData = data;
    return this;
  }

  update(data: any) {
    this.method = 'PATCH';
    this.bodyData = data;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    }
  }

  async execute() {
    let data = getData(this.table);

    // Apply filters
    Object.entries(this.queryParams).forEach(([key, value]) => {
      if (key !== 'select' && key !== 'order' && key !== 'limit' && key !== 'offset') {
        data = data.filter((item: any) => String(item[key]) === value);
      }
    });

    // Apply sorting
    if (this.queryParams.order) {
      const [field, dir] = this.queryParams.order.split(':');
      data.sort((a: any, b: any) => {
        if (a[field] < b[field]) return dir === 'asc' ? -1 : 1;
        if (a[field] > b[field]) return dir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    const limit = this.queryParams.limit ? parseInt(this.queryParams.limit, 10) : data.length;
    const offset = this.queryParams.offset ? parseInt(this.queryParams.offset, 10) : 0;

    if (this.method === 'POST' && this.bodyData) {
      const newItem = { ...this.bodyData };
      data.unshift(newItem);
      setData(this.table, data);
      return { data: newItem, error: null };
    }

    if (this.method === 'PATCH' && this.bodyData) {
      const updatedItems = data.map((item: any) => {
        const matches = Object.entries(this.queryParams).every(([k, v]) =>
          k === 'select' || k === 'order' || k === 'limit' || k === 'offset' || item[k] === v
        );
        return matches ? { ...item, ...this.bodyData } : item;
      });
      setData(this.table, updatedItems);
      return { data: this.bodyData, error: null };
    }

    if (this.method === 'DELETE') {
      const filterKeys = Object.keys(this.queryParams).filter(k =>
        k !== 'select' && k !== 'order' && k !== 'limit' && k !== 'offset'
      );
      if (filterKeys.length > 0) {
        const remaining = data.filter((item: any) =>
          !filterKeys.every(k => item[k] === this.queryParams[k])
        );
        setData(this.table, remaining);
      }
      return { data: null, error: null };
    }

    const paginated = data.slice(offset, offset + limit);
    return { data: paginated, error: null };
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export const api = new ApiClient();
export { AUTH_TOKEN_KEY };
