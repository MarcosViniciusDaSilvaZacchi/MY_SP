// ──────────────────────────────────────────────────────────────────
// Interfaces e Implementações de Segurança (C4: JWT Utility & Password Hasher)
// ──────────────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class IJwtService {
  gerarToken(payload, expiresIn) {
    throw new Error('Método gerarToken() não implementado');
  }

  verificarToken(token) {
    throw new Error('Método verificarToken() não implementado');
  }
}

class JwtService extends IJwtService {
  constructor(secret = process.env.JWT_SECRET || 'my-parking-secret', defaultExpiresIn = process.env.JWT_EXPIRES_IN || '8h') {
    super();
    this.secret = secret;
    this.defaultExpiresIn = defaultExpiresIn;
  }

  gerarToken(payload, expiresIn = this.defaultExpiresIn) {
    return jwt.sign(payload, this.secret, { expiresIn });
  }

  verificarToken(token) {
    return jwt.verify(token, this.secret);
  }
}

class IPasswordHasher {
  hash(senha) {
    throw new Error('Método hash() não implementado');
  }

  compare(senha, hash) {
    throw new Error('Método compare() não implementado');
  }
}

class BcryptPasswordHasher extends IPasswordHasher {
  constructor(saltRounds = 10) {
    super();
    this.saltRounds = saltRounds;
  }

  hash(senha) {
    return bcrypt.hashSync(senha, this.saltRounds);
  }

  compare(senha, hash) {
    return bcrypt.compareSync(senha, hash);
  }
}

module.exports = {
  IJwtService,
  JwtService,
  IPasswordHasher,
  BcryptPasswordHasher,
};
