# VibeTube API v3.5

Backend persistente de referência com:
- cadastro/login
- tokens JWT
- senha com scrypt
- playlists por usuário
- histórico por usuário
- sessão de reprodução por usuário

Execute:
```bash
npm install
JWT_SECRET="uma-chave-longa-e-secreta" npm start
```

O arquivo `vibetube-db.json` é apenas uma implementação simples para desenvolvimento. Em produção, troque por PostgreSQL/MySQL/SQLite gerenciado, HTTPS, rate limiting, logs e política de backup.

Nunca coloque `JWT_SECRET` no APK.
