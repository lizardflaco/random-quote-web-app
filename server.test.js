const request = require('supertest');
const app = require('./server');

describe('GET /api/quote', () => {
  it('should return a non-empty quote', async () => {
    const res = await request(app).get('/api/quote');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('quote');
    expect(res.body.quote).toEqual(expect.any(String));
    expect(res.body.quote.length).toBeGreaterThan(0);
  });
});
