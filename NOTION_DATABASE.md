# Notion Integration Configuration

## Database Connection

**Real Database ID:** `dfe11066-43af-4297-9a97-05da2b4b384c`  
**Database Name:** Exercise Library  
**Trainer:** Jasmine (ID: `ns7fn7xka93fgvr11beb6168gd89e5rr`)  
**Notion Token:** `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`

## Important Notes

### ⚠️ Wrong ID in Trainer Config
The saved ID `32997d6b662f80398d3dc6b2675739bc` is a **PAGE**, not a database.  
Do not use this ID for database queries.

### Database Schema
The `Exercise Library` database has these relevant fields:
- `Name` (title) - Exercise name
- `⭐Video` (url) - YouTube URL for the exercise

### Sync Scope
Only two fields are synced from Notion to Convex:
1. **Name** → Used as exercise identifier
2. **⭐Video** → Stored as `videoUrl` in Convex

### Current Status
- Total exercises in database: 100
- Exercises with videos: 7
- Token is valid and can query the database

## Quick Reference for Other Sessions

In any future session, you can reference this file and use:

```bash
# Use the correct database ID (NOT the page ID)
Database ID: dfe11066-43af-4297-9a97-05da2b4b384c

# Fields to import:
- Name → exercise name
- ⭐Video → videoUrl
```