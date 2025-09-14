# Overview

DealSpot is a modern web application for discovering and purchasing local deals and discounts. Built as a full-stack React application, it allows users to browse deals from local businesses, make reservations, purchase vouchers, and manage their favorites. The application focuses on mobile-first design with features like location-based search, category filtering, and integrated payment processing.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client-side is built with React 18 using TypeScript and follows a modern component-based architecture:

- **Framework**: React with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with custom styling via shadcn/ui
- **Build Tool**: Vite for fast development and optimized builds

The frontend follows a page-based structure with reusable components, implementing responsive design patterns and mobile-first principles.

## Backend Architecture

The server-side uses Express.js with a modern TypeScript setup:

- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: OpenID Connect (OIDC) integration with Replit Auth
- **Session Management**: Express sessions with PostgreSQL storage
- **File Structure**: Organized with separate concerns for routes, storage, and database operations

The backend implements a service layer pattern with the storage module abstracting database operations and providing a clean interface for business logic.

## Database Design

PostgreSQL database with Drizzle ORM providing:

- **User Management**: Required tables for Replit Auth integration (users, sessions)
- **Business Logic**: Tables for categories, businesses, deals, vouchers, reservations, reviews, favorites, and notifications
- **Relationships**: Proper foreign key relationships between entities
- **Type Safety**: Generated TypeScript types from database schema

The schema supports the full application lifecycle from user registration to deal purchase and usage tracking.

## Authentication System

Integrated with Replit's OpenID Connect authentication:

- **Provider**: Replit OIDC for seamless integration in the Replit environment
- **Session Storage**: PostgreSQL-backed sessions for persistence
- **Middleware**: Passport.js strategy for handling authentication flows
- **User Management**: Automatic user profile creation and management

This provides secure authentication without requiring custom user management implementation.

## API Architecture

RESTful API design with:

- **Route Organization**: Grouped by feature (auth, categories, businesses, deals, etc.)
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Request Validation**: Input validation using Zod schemas
- **Response Format**: Consistent JSON responses with proper error messages

The API follows REST conventions while providing the necessary endpoints for the frontend's requirements.

# External Dependencies

## Core Framework Dependencies

- **@neondatabase/serverless**: PostgreSQL database connection for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight React router
- **express**: Node.js web framework

## UI and Styling

- **@radix-ui/react-***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library built on Radix UI
- **class-variance-authority**: Utility for managing component variants
- **lucide-react**: Icon library

## Authentication and Session Management

- **openid-client**: OpenID Connect client implementation
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

## Development and Build Tools

- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **@replit/vite-plugin-cartographer**: Replit-specific development tools

## Utility Libraries

- **zod**: Schema validation library
- **date-fns**: Date manipulation utilities
- **clsx**: Conditional CSS class composition
- **nanoid**: Unique ID generation

The application leverages Replit's infrastructure for deployment and database provisioning, with Neon Database providing the PostgreSQL backend.