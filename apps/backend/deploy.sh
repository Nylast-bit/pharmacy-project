git pull
cd backend
pnpm install
pnpm build
pm2 restart pharmacy-api
cd ../frontend
pnpm install
pnpm build
