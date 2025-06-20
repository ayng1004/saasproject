const jwt = require('jsonwebtoken');
const { authenticate } = require('../../src/middlewares/authenticate');

describe('Authenticate Middleware', () => {
  it('should proceed if valid token', () => {
    const token = jwt.sign({ userId: 1, role: 'Admin' }, 'default_jwt_secret');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};
    const next = jest.fn();

    authenticate(req, res, next);
    expect(req.user).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it('should reject if token is invalid', () => {
    const req = { headers: { authorization: `Bearer wrongtoken` } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });
});
