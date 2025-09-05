# Production-Grade Curriculum Management with Sanity CMS

This guide will help you set up the production-ready curriculum management system using Sanity CMS.

## 🚀 Quick Setup Overview

1. **Create Sanity Project** - Set up Sanity CMS project
2. **Configure Environment** - Add Sanity credentials to environment variables  
3. **Migrate Curriculum Data** - Import existing JSON data to Sanity
4. **Deploy to Production** - Update Cloud Run deployment with Sanity integration
5. **Access Content Management** - Use Sanity Studio to manage curriculum

## 📋 Detailed Setup Instructions

### Step 1: Create Sanity Project

1. **Sign up for Sanity** at https://sanity.io
2. **Create new project**:
   ```bash
   cd apps/web
   npx sanity@latest init
   ```
   - Choose "Create new project"
   - Project name: "TutorAI Curriculum"
   - Dataset: "production" 
   - Use TypeScript: Yes
   - Use existing schema: No (we have custom schemas)

3. **Note the Project ID** - You'll need this for environment variables

### Step 2: Get API Token

1. **Go to Sanity Management**: https://sanity.io/manage
2. **Select your project**
3. **Go to API tab**
4. **Add API token**:
   - Name: "TutorAI Backend"
   - Permissions: "Editor" (read + write)
   - **Copy the token** - you won't see it again!

### Step 3: Configure Environment Variables

1. **Copy environment template**:
   ```bash
   cp .env.example .env.local
   ```

2. **Add Sanity configuration** to `.env.local`:
   ```env
   # Sanity CMS Configuration
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id_from_step1
   NEXT_PUBLIC_SANITY_DATASET=production
   NEXT_PUBLIC_SANITY_API_VERSION=2024-08-30
   SANITY_API_TOKEN=skxxxxxxxxxxxxxxxxxxxxxxx_from_step2
   ```

3. **Keep existing Firebase/GCP variables** as they are

### Step 4: Install Dependencies and Migrate Data

1. **Install new dependencies**:
   ```bash
   pnpm install
   ```

2. **Run curriculum migration**:
   ```bash
   pnpm migrate-curriculum
   ```
   
   This will:
   - ✅ Read all JSON files from curriculum directory
   - ✅ Transform data to Sanity format  
   - ✅ Upload to your Sanity project
   - ✅ Show migration summary

### Step 5: Start Sanity Studio (Optional - for content management)

1. **Start Sanity Studio**:
   ```bash
   pnpm sanity
   ```

2. **Access at**: http://localhost:3333
3. **Login with your Sanity account**
4. **Explore curriculum content** - organized by grade, subject, and topic

### Step 6: Test Locally

1. **Start development server**:
   ```bash
   pnpm dev
   ```

2. **Test curriculum API**:
   - Visit: http://localhost:3000/api/curriculum/topics?grade=primary-6&subject=mathematics
   - Should return topics from Sanity (not local files)

3. **Test tutoring page**:
   - Visit: http://localhost:3000/tutor?grade=primary-6&subject=mathematics&topic=algebra&subtopic=unknown-letter
   - Should load curriculum from Sanity

### Step 7: Deploy to Production

1. **Update Cloud Build environment variables** in `cloudbuild-direct.yaml`:
   ```yaml
   --set-env-vars=NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id,NEXT_PUBLIC_SANITY_DATASET=production,NEXT_PUBLIC_SANITY_API_VERSION=2024-08-30
   ```

2. **Add Sanity API token to Secret Manager**:
   ```bash
   echo "your_sanity_api_token" | gcloud secrets create SANITY_API_TOKEN --data-file=-
   ```

3. **Update Cloud Build to mount the secret**:
   ```yaml
   --set-secrets=SANITY_API_TOKEN=SANITY_API_TOKEN:latest
   ```

4. **Deploy**:
   ```bash
   gcloud builds submit --config=cloudbuild-direct.yaml
   ```

## 🎯 Production Benefits

### ✅ **Professional Content Management**
- **Visual interface** for curriculum teams
- **Real-time collaboration** on content updates
- **Version control** with rollback capabilities
- **Content validation** to prevent errors

### ✅ **Scalable Architecture** 
- **Real-time updates** without application deployments
- **CDN-delivered content** for fast global access
- **API-driven** for future integrations
- **Unlimited content** capacity

### ✅ **Developer Experience**
- **TypeScript types** auto-generated from schemas
- **Real-time queries** with GROQ query language
- **Webhook support** for content change notifications
- **Preview mode** for testing content changes

## 📊 Content Structure

Your curriculum is now structured as:
- **Document Type**: `subtopic` (main content)
- **Organized by**: Grade → Subject → Topic → Subtopic
- **Rich Content**: Learning objectives, Socratic scaffolding, assessments
- **Searchable**: Full-text search across all curriculum content

## 🛠 Managing Content

### Adding New Subtopics
1. **Open Sanity Studio**: http://localhost:3333 (or your hosted Studio URL)
2. **Create new subtopic document**
3. **Fill in all required fields**
4. **Publish** - content immediately available via API

### Updating Existing Content  
1. **Find subtopic** in Sanity Studio
2. **Edit any field** - metadata, learning objectives, Socratic questions, etc.
3. **Publish changes** - updates live immediately

### Content Validation
- **Required fields** enforced by schema
- **Data types** validated (numbers, strings, arrays)
- **Relationship integrity** maintained automatically

## 🚨 Troubleshooting

### Migration Issues
- **Check API token permissions** - needs Editor role
- **Verify project ID** - should be from your Sanity project
- **Check curriculum directory** - should contain JSON files

### API Issues  
- **Check environment variables** - all Sanity vars must be set
- **Verify Sanity client** - should connect without errors
- **Check query syntax** - GROQ queries are case-sensitive

### Deployment Issues
- **Ensure secrets are created** in Secret Manager
- **Check Cloud Build logs** for specific errors
- **Verify environment variables** are properly mounted

## 📚 Next Steps

1. **Set up webhooks** for real-time content updates
2. **Add content preview** for testing changes before publishing  
3. **Create custom Studio plugins** for advanced curriculum management
4. **Set up automated content backups**
5. **Add content analytics** to track curriculum usage

---

**🎉 Congratulations!** You now have a production-grade curriculum management system that scales with your educational platform.