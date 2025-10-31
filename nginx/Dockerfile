FROM nginx:1.28-alpine

# Copy the custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create a simple health check page
RUN echo "healthy" > /usr/share/nginx/html/health.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
