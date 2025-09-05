# 42Web.io - Tech Website

A modern, responsive website built with Node.js and Express.js, inspired by the design and functionality of tech.42web.io.

## Features

- **Modern Design**: Clean, professional design with responsive layout
- **Multiple Pages**: Home, About, Services, and Contact pages
- **Interactive Elements**: Smooth scrolling, animations, and form validation
- **Contact Form**: Functional contact form with server-side handling
- **Bootstrap Integration**: Bootstrap 5 for responsive grid and components
- **Font Awesome Icons**: Professional iconography throughout the site
- **SEO Friendly**: Proper meta tags and semantic HTML structure
- **Iframe Embedding**: Embeddable widgets for integration into other websites

## Embedding 42Web.io

The website includes powerful embedding capabilities that allow you to integrate 42Web.io content into other websites using iframes.

### Embed URLs

- **Home Widget**: `/embed` or `/embed?page=home`
- **Services Widget**: `/embed?page=services`
- **About Widget**: `/embed?page=about`
- **Contact Widget**: `/embed?page=contact`

### Embedding Options

You can customize the embedded content using URL parameters:

- `page`: Specify which page to embed (`home`, `services`, `about`, `contact`)
- `theme`: Choose visual theme (`default`, `minimal`, `dark`, `compact`)

### Example Usage

```html
<!-- Basic embed -->
<iframe src="http://localhost:3000/embed" width="100%" height="400"></iframe>

<!-- Services with minimal theme -->
<iframe src="http://localhost:3000/embed?page=services&theme=minimal" width="100%" height="500"></iframe>

<!-- Contact form in compact mode -->
<iframe src="http://localhost:3000/embed?page=contact&theme=compact" width="100%" height="350"></iframe>
```

### Responsive Embedding

For responsive embedding, use CSS:

```css
.embed-container {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
    height: 0;
    overflow: hidden;
}

.embed-container iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
```

## Tech Stack

- **Backend**: Node.js with Express.js
- **Frontend**: EJS templating engine
- **Styling**: Bootstrap 5 + Custom CSS
- **Icons**: Font Awesome 6
- **JavaScript**: Vanilla JS for interactive features

## Project Structure

```
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── views/                 # EJS templates
│   ├── layout.ejs        # Main layout template
│   ├── index.ejs         # Home page
│   ├── about.ejs         # About page
│   ├── services.ejs      # Services page
│   ├── contact.ejs       # Contact page
│   ├── 404.ejs           # 404 error page
│   └── error.ejs         # General error page
├── public/               # Static assets
│   ├── css/
│   │   └── style.css     # Custom styles
│   ├── js/
│   │   └── main.js       # Custom JavaScript
│   └── images/           # Image assets
└── README.md             # Project documentation
```

## Installation

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository-url>
   cd tech-website
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   
   Or for production:
   ```bash
   npm start
   ```

4. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon (auto-restart)

## Pages

### Home Page (`/`)
- Hero section with call-to-action
- Features showcase
- Technology stack display
- Contact call-to-action

### About Page (`/about`)
- Company mission and vision
- Team member profiles
- Company values
- Statistics and achievements

### Services Page (`/services`)
- Detailed service offerings
- Development process explanation
- Technology specializations
- Pricing information

### Contact Page (`/contact`)
- Contact form with validation
- Company contact information
- FAQ section
- Social media links

## Features in Detail

### Responsive Design
- Mobile-first approach
- Bootstrap 5 grid system
- Custom media queries for optimal viewing

### Interactive Elements
- Smooth scrolling navigation
- Hover effects and animations
- Form validation with real-time feedback
- Loading states for form submissions

### Performance Optimizations
- Optimized CSS and JavaScript
- Efficient image handling
- Minimal dependencies
- Fast server response times

## Customization

### Styling
Edit `public/css/style.css` to customize:
- Color scheme (CSS custom properties)
- Typography
- Layout spacing
- Component styles

### Content
Modify the EJS templates in the `views/` directory to update:
- Page content
- Navigation items
- Contact information
- Company details

### Functionality
Update `server.js` to:
- Add new routes
- Modify form handling
- Integrate with databases
- Add authentication

## Deployment

### Environment Variables
Set the following environment variable for production:
```bash
PORT=3000  # Or your preferred port
```

### Production Deployment
1. **Install dependencies**:
   ```bash
   npm install --production
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

### Docker Deployment (Optional)
Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please contact:
- Email: hello@42web.io
- Phone: +1 (555) 123-4567

## Acknowledgments

- Bootstrap team for the excellent framework
- Font Awesome for the comprehensive icon library
- Express.js community for the robust web framework
