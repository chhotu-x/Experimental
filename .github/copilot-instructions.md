# Copilot Instructions for Tech Website

## Project Overview
This is a modern, responsive tech website built with Node.js and Express.js, inspired by 42web.io. The project follows a traditional MVC architecture with server-side rendering using EJS templates.

## Project Structure
- `server.js` - Main Express.js server file with routes and middleware
- `views/` - EJS templates (layout.ejs, index.ejs, about.ejs, services.ejs, contact.ejs, 404.ejs, error.ejs)
- `public/` - Static assets (CSS, JS, images)
- `middleware/` - Custom Express middleware
- `data/` - Static data files

## Technology Stack
- **Backend**: Node.js with Express.js
- **Frontend**: EJS templating engine
- **Styling**: Bootstrap 5 + Custom CSS
- **Icons**: Font Awesome 6
- **JavaScript**: Vanilla JS for interactive features

## Coding Guidelines

### File Organization
- Keep routes organized in `server.js` with clear RESTful patterns
- Use EJS templates in `views/` directory with proper inheritance via `layout.ejs`
- Store static assets in `public/` with subdirectories for CSS, JS, and images
- Place reusable middleware in `middleware/` directory

### Code Style
- Use ES6+ JavaScript features (const/let, arrow functions, template literals)
- Follow Express.js best practices for middleware and routing
- Use descriptive variable and function names
- Keep functions small and focused
- Add comments for complex logic

### EJS Templates
- Use `layout.ejs` as the base template for all pages
- Include proper meta tags for SEO
- Follow Bootstrap 5 grid system and component patterns
- Use semantic HTML5 elements
- Ensure responsive design principles

### CSS/Styling
- Use Bootstrap 5 classes for layout and components
- Place custom styles in `public/css/style.css`
- Use CSS custom properties for color schemes and theming
- Follow mobile-first responsive design approach
- Maintain consistent spacing and typography

### JavaScript
- Place client-side JavaScript in `public/js/main.js`
- Use vanilla JavaScript, avoid jQuery unless necessary
- Implement proper form validation and user feedback
- Add smooth scrolling and appropriate animations
- Ensure accessibility and keyboard navigation

## Common Patterns

### Route Structure
```javascript
app.get('/', (req, res) => {
  res.render('index', { 
    title: 'Home',
    page: 'home'
  });
});
```

### Error Handling
- Use Express error middleware for centralized error handling
- Render appropriate error pages (404.ejs, error.ejs)
- Log errors appropriately

### Form Handling
- Validate form inputs on both client and server side
- Provide clear user feedback for form submissions
- Use proper HTTP status codes

## Dependencies
- Express.js for server framework
- EJS for templating
- Bootstrap 5 for UI components
- Font Awesome for icons
- Helmet for security
- Compression for performance
- Express-rate-limit for rate limiting

## Development Commands
- `npm start` - Production server
- `npm run dev` - Development server with nodemon
- `npm test` - Run tests (currently not implemented)

## Best Practices
1. Always validate user inputs
2. Use proper HTTP status codes
3. Implement proper error handling
4. Follow security best practices (helmet, rate limiting)
5. Keep code DRY and modular
6. Write semantic HTML
7. Ensure accessibility compliance
8. Test across different devices and browsers
9. Optimize for performance
10. Use proper git commit messages

## When Adding New Features
1. Follow the existing project structure
2. Update routes in `server.js`
3. Create corresponding EJS templates
4. Add necessary styles to `style.css`
5. Test responsive behavior
6. Ensure proper error handling
7. Update documentation if needed

## Security Considerations
- Use helmet for basic security headers
- Implement rate limiting
- Validate and sanitize all inputs
- Use HTTPS in production
- Keep dependencies updated