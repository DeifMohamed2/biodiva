# Student Status Management Scripts

This directory contains scripts for managing student status based on their card assignment and video watching activity.

## Student Status Logic

The system determines student status using the following logic:

### Center Students
- Students who have a card assigned AND haven't watched any videos (10% threshold)
- Students who don't have a card assigned AND haven't watched any videos

### Online Students  
- All other students (those who have watched videos regardless of card status)

## Scripts

### updateStudentStatus.js

Main script for updating student statuses based on the logic above.

#### Usage

```bash
# Basic usage (dry run first to preview changes)
npm run update-student-status -- --dry-run

# Update all students
npm run update-student-status

# Update specific grade
npm run update-student-status -- --grade Grade1

# Update with custom batch size
npm run update-student-status -- --batch-size 50

# Update only center students
npm run update-student-status -- --status center
```

#### Options

- `--dry-run`: Preview changes without making updates
- `--batch-size <number>`: Number of students to process at once (default: 100)
- `--grade <grade>`: Filter by specific grade (Grade1, Grade2, Grade3)
- `--status <status>`: Filter by current status (online, center)
- `--help`: Show help message

#### Examples

```bash
# Preview what would change for Grade1 students
npm run update-student-status -- --dry-run --grade Grade1

# Update all center students with smaller batch size
npm run update-student-status -- --status center --batch-size 25

# Update all students (production run)
npm run update-student-status
```

## Database Models

### User Model
- `place`: String enum ['online', 'center'] - Current student status
- `videosInfo`: Array of video watching information
  - `hasWatched10Percent`: Boolean - Whether student watched 10% of video

### Card Model  
- `userId`: ObjectId reference to User
- `isActive`: Boolean - Whether card is currently active

## Implementation Details

The script processes students in batches to avoid overwhelming the database. It:

1. Queries students based on filters
2. For each student:
   - Checks if they have an active card
   - Checks if they've watched any videos (10% threshold)
   - Determines new status based on logic
   - Updates database if status changed
3. Provides detailed statistics and logging

## Safety Features

- **Dry Run Mode**: Preview changes before applying
- **Batch Processing**: Process students in manageable chunks
- **Error Handling**: Continues processing even if individual students fail
- **Detailed Logging**: Track all changes and errors
- **Statistics**: Comprehensive reporting of results

## Monitoring

The script provides detailed output including:
- Total students processed
- Number of status changes made
- Distribution of final statuses
- Any errors encountered
- Processing time and performance metrics
