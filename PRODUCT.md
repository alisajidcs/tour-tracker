# Tour Tracker

## 1. Overview

Tour Tracker is a lightweight, browser-based application for discovering, organizing, and tracking places to visit within a city.

The application combines a **recommended list of attractions** with a **travel checklist**, allowing travelers to plan short trips, mark places as visited, and track remaining attractions for future visits.

The initial version is designed for personal use, with the possibility of becoming an open-source, multi-user application later.

## 2. Problem Statement

When visiting a city for a short trip, travelers often struggle with:

- Finding and organizing attractions worth visiting.
- Deciding which places to prioritize.
- Tracking places they have already visited.
- Remembering unexplored attractions for future trips.
- Maintaining their travel plans across devices.

Existing Tour Tracker can be unnecessarily complicated for travelers who simply want a prioritized checklist.

## 3. Goals

- Provide a simple, visual city-based travel checklist.
- Display attractions in a recommended visiting order.
- Allow travelers to mark attractions as visited.
- Automatically move visited attractions to the bottom.
- Preserve travel progress across devices.
- Support quick manual entry and bulk JSON import.
- Keep the initial version inexpensive and easy to use.

## 4. Target Users

**V1:** A single traveler using the application for personal trips.

**Future:** Travelers planning short city breaks, weekend trips, or visits lasting approximately 1–3 days.

The product is primarily designed for quick sightseeing rather than detailed itinerary management.

## 5. Core User Experience

### 5.1 City Listing

The homepage displays available cities.

Each city contains:

- City name
- Cover image
- Short description
- List of attractions

Selecting a city opens its detail page.

### 5.2 City Detail Page

The city detail page contains:

- City name and cover image
- Short city description
- Recommended places arranged in editorial columns
- Recommended attraction order
- Visited/unvisited status
- A share action for the city guide

Each attraction card displays:

- Attraction name
- Image
- Short description
- Recommended position
- An icon-only visited checkbox
- Links to the place detail page and Google Maps search

### 5.3 Place Detail Page

Each place has its own shareable detail page containing:

- Place name and short description
- A longer description when available
- A cover image and selectable gallery images
- A link to find the place in Google Maps
- A share action with a city- and place-specific preview image and description

The interface must be responsive across desktop and mobile devices.

### 5.4 Travel Checklist

Users can mark any attraction as visited, regardless of its recommended position.

When an attraction is marked as visited:

- Its status is saved.
- It automatically moves below unvisited attractions.
- Remaining attractions retain their recommended order.
- The user can uncheck it to restore its position.

Visited progress must persist across browser sessions and synchronize between devices.

### 5.5 City and Attraction Management

A management interface allows the owner to:

- Add new cities.
- Edit existing city details.
- Add attractions individually.
- Edit or remove attractions.
- Set and change recommended attraction order.
- Attach a cover image and gallery images using URLs.
- Write a short and a longer place description.
- Review city requests submitted by signed-in users and start a city guide from a request.
- See city and place image previews in the management interface.
- Navigate cities, places, and requests through separate admin URLs.
- Create and edit content in dialogs.
- Edit an individual place as validated JSON while preserving its ID, visit progress, and recommended position.

The recommended order is controlled through the management interface, not through the travel checklist.

### 5.6 Bulk JSON Import

The application supports importing multiple attractions into an existing city using JSON.

Requirements:

- Paste JSON into an import interface.
- Validate the JSON structure.
- Show understandable validation errors.
- Add valid attractions to the existing city.
- Preserve existing attractions.
- Preserve imported ordering.

**Import behavior:** Append, never replace.

Example:

```json
{
  "places": [
    {
      "name": "Frauenkirche",
      "description": "A historic church in Dresden.",
      "imageUrl": "https://example.com/frauenkirche.jpg",
      "order": 1
    },
    {
      "name": "Zwinger Palace",
      "description": "A famous Baroque palace complex.",
      "imageUrl": "https://example.com/zwinger.jpg",
      "order": 2
    }
  ]
}
```

Imported ordering determines the relative order of the new attractions. Existing attractions retain their positions.

### 5.7 City Requests

The home page always shows an option to request a city. Guests are asked to sign in before submitting a request. Signed-in users submit a city name; the admin sees pending requests and can open the new-city form with that name prefilled.

### 5.8 City Guide JSON Import

The admin can create a city and its places in one JSON import. Entering a city name in the new-city form reveals a copyable prompt containing that name and the expected JSON format. The server validates the complete payload and creates the city and places atomically. The existing places-only import continues to append places to a selected city.

Place JSON may include `longDescription` and `galleryImageUrls`; image values remain HTTPS URLs.

### 5.9 Sharing

City and place pages provide a share action. The app uses the browser share sheet when available and otherwise copies the link. Shared city and place links show the matching title, description, and image in messaging and social previews.

## 6. Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | Display a list of cities |
| FR-02 | View city details and attractions |
| FR-03 | Display attraction images and descriptions |
| FR-04 | Mark attractions visited/unvisited |
| FR-05 | Automatically move visited attractions below unvisited ones |
| FR-06 | Persist checklist progress |
| FR-07 | Synchronize data between devices |
| FR-08 | Create, edit, and delete cities |
| FR-09 | Create, edit, and delete attractions |
| FR-10 | Manage recommended attraction order |
| FR-11 | Import attractions using JSON |
| FR-12 | Validate imported data |
| FR-13 | Support responsive desktop and mobile layouts |
| FR-14 | Give every place a detail page with extended description and image gallery |
| FR-15 | Provide Google Maps search links for places |
| FR-16 | Share city and place pages with matching social preview metadata |
| FR-17 | Let signed-in users request cities and let admins create guides from requests |
| FR-18 | Allow admins to create a city and its places atomically from JSON |

## 7. Business Rules

1. Each attraction belongs to one city.
2. Attractions have an owner-defined recommended order.
3. Travelers can visit attractions in any order.
4. Unvisited attractions always appear before visited attractions.
5. Within each group, attractions retain their recommended order.
6. Unchecking an attraction restores its original recommended position.
7. JSON imports append attractions without deleting existing entries.
8. Checklist progress must persist between sessions and devices.
9. V1 requires an internet connection.
10. City and attraction content is entered manually.

## 8. V1 Scope

**Included**

- Responsive browser-based application
- City listing and detail pages
- Attraction cards with images
- Short descriptions
- Visited checklist
- Automatic visited-item sorting
- Persistent cross-device synchronization
- City and attraction management
- Manual attraction entry
- Bulk JSON import
- City and place detail pages with image galleries
- Google Maps search links
- City and place sharing previews
- Signed-in city requests
- City-plus-places JSON import
- Image URLs

**Excluded**

- AI-generated city information
- Automatic attraction discovery
- Image uploads and cloud image storage
- Maps and navigation
- Route optimization
- Automatic trip duration calculations
- Hotel or transportation booking
- Public user registration
- Social features
- Offline support

## 9. Constraints

- Minimize operating and hosting costs.
- Prioritize personal use over public scalability.
- The application must work on mobile and desktop browsers.
- Internet connectivity can be assumed.
- Image URLs are sufficient for V1.
- Cross-device progress synchronization is mandatory.
- The product should remain simple to maintain.

## 10. Future Features

Potential enhancements include:

- **AI city generation:** Enter a city name and automatically generate attractions, descriptions, and images.
- **User accounts:** Allow multiple travelers to maintain independent checklists.
- **Image uploads:** Support personal photos and managed image storage.
- **Map integration:** Display attractions geographically.
- **Trip recommendations:** Suggest attractions based on available days.
- **Progress statistics:** Display visited counts and completion percentages.
- Social discovery features beyond sharing city and place links.
- **Offline support:** Access saved plans without connectivity.

These features are not part of V1.

## 11. Acceptance Criteria

V1 is complete when:

- [ ] The owner can create a city with its name, description, and image.
- [ ] The owner can add, edit, delete, and reorder attractions.
- [ ] Each attraction displays an image, name, and description.
- [ ] Attractions appear in their configured recommended order.
- [ ] Checking an attraction moves it below unvisited attractions.
- [ ] Unchecking restores its recommended position.
- [ ] Checklist changes survive browser refreshes.
- [ ] Checklist changes synchronize between phone and laptop.
- [ ] The owner can bulk import attractions using JSON.
- [ ] JSON imports do not delete existing attractions.
- [ ] Invalid JSON produces understandable errors.
- [ ] The application works on mobile and desktop browsers.
- [ ] The application can be used without uploading images.
- [ ] Each place has a detail page with a gallery and expanded description.
- [ ] City and place links show the matching image and description in social previews.
- [ ] Guests can see the city request option but must sign in to submit.
- [ ] Admins can create a city from a request or a validated city-plus-places JSON batch.

