# Build the admin app, then hand the static bundle to nginx.
FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG APP_COMMIT=dev
RUN APP_COMMIT=${APP_COMMIT} npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/LICENSE /app/THIRD_PARTY_NOTICES.md /app/
EXPOSE 80
