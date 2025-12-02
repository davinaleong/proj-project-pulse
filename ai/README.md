# Project Pulse AI - Frontend Only

This is the frontend interface for Project Pulse AI, built with Next.js and TypeScript. **This is a frontend-only version that runs completely in the browser with mock AI responses.**

## Features

- 🤖 Interactive chatbot interface with mock AI responses
- 🎨 Modern React components with Tailwind CSS
- 📝 TypeScript for type safety
- 📱 Fully responsive design
- 🚀 Static export ready for deployment
- 🎯 No server dependencies

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) to see the result.

4. Build for production:
```bash
npm run build
```

5. Serve static export:
```bash
npm run serve
```

## Project Structure

- `app/` - Next.js App Router pages and layouts
- `components/` - Reusable React components with TypeScript
- `services/` - Frontend services (chatbot with mock responses)
- `tailwind.config.ts` - Custom color palette configuration

## Deployment

This app can be deployed to any static hosting service:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag and drop the `out` folder after build
- **GitHub Pages**: Upload the `out` folder contents
- **Any web server**: Serve the `out` folder

## Demo Features

- **Mock AI Responses**: Contextual responses based on keywords
- **Realistic Chat Flow**: Simulated typing delays and conversation flow
- **Project Insights**: Demo responses about tech stacks and project structure
- **Responsive Design**: Works on desktop and mobile devices

## Converting to Full Backend Integration

To add real AI integration later:

1. Add Azure dependencies back to `package.json`
2. Restore the `/api` routes for server-side calls
3. Configure environment variables for Azure AI Search
4. Update the chatbot service to use API endpoints instead of mock responses
