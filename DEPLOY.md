# Деплой DROP.AI

Три рабочих варианта. По убыванию популярности и удобства.

## Вариант 1 — VPS + Docker (рекомендуется)

Подходит для любого VPS (Selectel, Timeweb, Reg.ru, Hetzner). Бережёт SQLite, легко переезжает.

```bash
# На сервере
git clone <your-repo> drop-ai && cd drop-ai
cp .env.example .env
# Заполнить .env (BETTER_AUTH_SECRET, ROBOKASSA_*, DROPAI_LEGAL_*, OPENAI_API_KEY если есть)
docker compose up -d --build
docker compose logs -f
```

Перед первым запуском прогнать миграции Better Auth (создание таблиц user/session/account):

```bash
docker compose exec drop-ai npx @better-auth/cli@latest migrate --yes
```

### Nginx + Let's Encrypt

```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo cp nginx.conf.example /etc/nginx/sites-available/drop-ai
sudo ln -s /etc/nginx/sites-available/drop-ai /etc/nginx/sites-enabled/
sudo certbot --nginx -d drop.ai -d www.drop.ai
sudo systemctl reload nginx
```

В личном кабинете Robokassa указать **Result URL**: `https://drop.ai/api/billing/robokassa/result`.

### Бэкапы

```bash
# В cron, раз в сутки
docker run --rm -v drop-ai_dropai_data:/d -v $PWD/backups:/b alpine \
  sh -c 'sqlite3 /d/dropai.db ".backup /b/dropai-$(date +%F).db"'
```

## Вариант 2 — Vercel / Cloudflare Pages

Требует замены SQLite на серверную БД, потому что serverless-функции не имеют постоянного файлового хранилища.

Что нужно поменять:

1. Подключить **Neon Postgres** (free tier) или **Turso libSQL**.
2. В `lib/db.ts` и `lib/auth.ts` заменить `better-sqlite3` на `pg` / `@libsql/client`.
3. Загрузки изображений переключить с локального FS на **Vercel Blob** или **Cloudflare R2**.

Дальше деплой обычный: `vercel deploy` или GitHub Actions.

## Вариант 3 — Railway / Render

Самый простой путь, без своей инфраструктуры:

1. Подключить репозиторий, выбрать **Dockerfile** деплой.
2. Добавить **persistent volume**, смонтировать в `/data` (для SQLite) и `/app/public/uploads`.
3. Заполнить переменные окружения из `.env.example`.

Railway автоматически даст домен `*.up.railway.app`. Для своего домена — добавить CNAME.

## Чек-лист перед запуском в проде

- [ ] `BETTER_AUTH_SECRET` сгенерирован (`openssl rand -hex 32`).
- [ ] `ROBOKASSA_IS_TEST=0` (выключен тестовый режим), Result URL прописан в кабинете Robokassa.
- [ ] `DROPAI_LEGAL_*` заполнены реальными данными самозанятого/ИП.
- [ ] Подключён `OPENAI_API_KEY` (или оставлен Pollinations как бесплатный fallback).
- [ ] Настроен HTTPS (Let's Encrypt / Cloudflare).
- [ ] Регулярные бэкапы `dropai.db` (раз в сутки минимум).
- [ ] Папка `public/uploads` бэкапится отдельно (или вынесена на S3-совместимое хранилище).
- [ ] Заведён мониторинг (Umami для аналитики уже встроен; uptime — UptimeRobot / Better Uptime).
- [ ] Зарегистрирован самозанятый в «Мой Налог», подключён к Robokassa для автогенерации чеков.

## Поднять локально для разработки

```bash
npm install
npx @better-auth/cli@latest migrate --yes  # один раз
cp .env.example .env
# (опционально) заполнить ключи
npm run dev
# http://localhost:3000
```
