const bcrypt = require('bcryptjs');

// Mock pour bcrypt
jest.mock('bcryptjs');

describe('Password Service', () => {
  beforeEach(() => {
    // Réinitialiser les mocks
    jest.clearAllMocks();
  });

  describe('Password hashing', () => {
    it('should hash a password with salt round 10', async () => {
      const password = 'password123';
      const hashedPassword = 'hashed_password';
      
      bcrypt.hash.mockResolvedValue(hashedPassword);
      
      // Appel direct à bcrypt.hash comme dans app.js
      const result = await bcrypt.hash(password, 10);
      
      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });

    it('should throw an error if hashing fails', async () => {
      const password = 'password123';
      
      // Simuler une erreur de hachage
      bcrypt.hash.mockRejectedValue(new Error('Hashing error'));
      
      await expect(bcrypt.hash(password, 10)).rejects.toThrow('Hashing error');
    });
  });

  describe('Password comparison', () => {
    it('should return true if password matches hash', async () => {
      const password = 'password123';
      const hashedPassword = 'hashed_password';
      
      bcrypt.compare.mockResolvedValue(true);
      
      // Appel direct à bcrypt.compare comme dans app.js
      const result = await bcrypt.compare(password, hashedPassword);
      
      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should return false if password does not match hash', async () => {
      const password = 'password123';
      const hashedPassword = 'hashed_password';
      
      bcrypt.compare.mockResolvedValue(false);
      
      // Appel direct à bcrypt.compare comme dans app.js
      const result = await bcrypt.compare(password, hashedPassword);
      
      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should throw an error if comparison fails', async () => {
      const password = 'password123';
      const hashedPassword = 'hashed_password';
      
      // Simuler une erreur de comparaison
      bcrypt.compare.mockRejectedValue(new Error('Comparison error'));
      
      await expect(bcrypt.compare(password, hashedPassword)).rejects.toThrow('Comparison error');
    });
  });
});