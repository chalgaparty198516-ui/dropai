# Деплой DROP.AI на Vercel через GitHub

Полное время: **~15 минут**. Нужны: GitHub-аккаунт, Vercel-аккаунт (free hobby tier подходит).

## 0. Локально: подготовить репо

В каталоге `C:\Users\home\drop-ai`:

```bash
git init -b main
git add -A
git commit -m "Initial commit: DROP.AI"
```

## 1. Создать пустой репозиторий на GitHub

1. Открыть https://github.com/new
2. Repository name: `drop-ai` (или любое)
3. Visibility: **Private** (рекомендуется — там твои ключи)
4. **НЕ** ставить галки «Add a README», `.gitignore`, license — должен быть пустой репо
5. Create repository
6. Скопировать URL вида `https://github.com/<твой_логин>/drop-ai.git`

## 2. Запушить код

```bash
git remote add origin https://github.com/<твой_логин>/drop-ai.git
git push -u origin main
```

Если GitHub попросит логин — открой Personal Access Token (https://github.com/settings/tokens) или используй GitHub CLI (`gh auth login`).

## 3. Импорт в Vercel

1. Открыть https://vercel.com/new
2. **Import Git Repository** → выбрать `drop-ai`
3. Framework Preset должен сам определиться как **Next.js**
4. Root Directory: `./`
5. **НЕ нажимай Deploy сразу** — сперва добавь storage и env (шаги 4–6)

## 4. Подключить Neon Postgres (БД)

1. В Vercel-проекте → **Storage** → **Browse Marketplace** → **Neon Postgres**
2. **Add Integration** → выбрать бесплатный план
3. Связать с проектом `drop-ai`
4. Vercel автоматически добавит переменные `DATABASE_URL`, `POSTGRES_URL` и др. в env

## 5. Подключить Vercel Blob (картинки)

1. **Storage** → **Create Database** → **Blob**
2. Name: `drop-ai-uploads`
3. Связать с проектом
4. Vercel добавит `BLOB_READ_WRITE_TOKEN` в env

## 6. Добавить остальные env-переменные

В **Settings → Environment Variables** (для Production + Preview + Development):

| Имя | Значение |
|-----|----------|
| `BETTER_AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `BETTER_AUTH_URL` | `https://<твой_домен>.vercel.app` (после деплоя поменять на свой домен) |
| `GEMINI_API_KEY` | Из https://aistudio.google.com/apikey |
| `OPENAI_API_KEY` | (опционально) из https://platform.openai.com/api-keys |
| `ROBOKASSA_MERCHANT_LOGIN` | Из кабинета Robokassa |
| `ROBOKASSA_PASSWORD1` | Из Robokassa |
| `ROBOKASSA_PASSWORD2` | Из Robokassa |
| `ROBOKASSA_IS_TEST` | `1` для теста, `0` для боевой оплаты |
| `DROPAI_LEGAL_NAME` | ФИО самозанятого |
| `DROPAI_LEGAL_INN` | ИНН |
| `DROPAI_LEGAL_CITY` | Город |
| `DROPAI_LEGAL_EMAIL` | Контактный email |
| `DROPAI_LEGAL_WEBSITE` | `https://<твой_домен>.vercel.app` |
| `GOOGLE_CLIENT_ID` | (опционально) из console.cloud.google.com |
| `GOOGLE_CLIENT_SECRET` | (опционально) |

## 7. Первый деплой

Нажми **Deploy**. Сборка ~2 минуты. По завершении получишь URL `https://drop-ai-<hash>.vercel.app`.

## 8. ВАЖНО: миграция Better Auth (один раз)

Better Auth должен создать таблицы `user`, `session`, `account`, `verification` в Neon Postgres. Наши таблицы `generations` и `payments` создаются автоматически при первом запросе (см. `ensureMigrations()` в `lib/db.ts`).

Вариант А — локально (одноразово):

```bash
# Положить DATABASE_URL из Vercel в локальный .env
echo "DATABASE_URL=postgres://..." >> .env
npx @better-auth/cli@latest migrate --yes
```

Вариант Б — Vercel CLI:

```bash
npm i -g vercel
vercel link
vercel env pull .env.production
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d= -f2-) npx @better-auth/cli@latest migrate --yes
```

После миграции таблицы будут видны в Neon Console.

## 9. Настроить Robokassa webhook

В кабинете Robokassa → Технические настройки:
- **Result URL**: `https://<твой_домен>.vercel.app/api/billing/robokassa/result`
- **Success URL**: `https://<твой_домен>.vercel.app/billing/success`
- **Fail URL**: `https://<твой_домен>.vercel.app/billing/fail`

## 10. Свой домен (опционально)

В Vercel → **Settings → Domains** → добавить `drop.ai` (или другой). Указать CNAME у регистратора. Обновить `BETTER_AUTH_URL` и `DROPAI_LEGAL_WEBSITE` в env, redeploy.

---

## Проверка

После всего: открыть `https://<домен>/`, зарегистрироваться, загрузить фото в студии, сгенерировать. Карточка должна сохраниться на Vercel Blob, проект — в Neon.

## Что НЕ деплоится

- `dropai.db` — локальный SQLite (в .gitignore)
- `public/uploads/*` — локальные превью (в .gitignore)
- `.env`, `.env.local`, `.env.production` (в .gitignore)
- `tmp_klikai` — папка анализа klikai.pro (в .dockerignore + .gitignore)

## Если что-то ломается

- **«Cannot find module 'better-sqlite3'»** на Vercel — это нормально для serverless. Better Auth должен взять Postgres из `DATABASE_URL`. Убедись что переменная есть в env проекта.
- **«no such table: user»** — забыл шаг 8 (миграции Better Auth).
- **OAuth Google не работает** — добавь `https://<твой_домен>.vercel.app/api/auth/callback/google` в Authorized redirect URIs в Google Cloud Console.
- **Картинки не сохраняются** — проверь что `BLOB_READ_WRITE_TOKEN` есть в env (должна добавиться автоматически при подключении Blob).
