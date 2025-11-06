# Agent Property Management API

Agents can now create, update, and delete their own property listings through a secure API!

## Features

✅ **Secure Authentication** - Only authenticated agents can manage properties  
✅ **Ownership Control** - Agents can only modify their own properties  
✅ **Real-Time Updates** - Changes appear instantly on dashboard  
✅ **Auto-Tracking** - Business metrics update automatically via Cloud Functions  
✅ **Simple API** - Easy-to-use JavaScript service  

---

## Quick Start

### In Agent Portal Pages

```html
<!-- Include Firebase and the service -->
<script src="/firebase-config.js"></script>
<script src="/assets/js/services/agent-property-service.js"></script>

<script>
// Initialize service
const propertyService = new AgentPropertyService();
await propertyService.initialize();

// Now use the API methods
</script>
```

---

## API Methods

### 1. Create Property

```javascript
const result = await propertyService.createProperty({
    address: {
        street: "123 Main St",
        city: "Los Angeles",
        state: "CA",
        zip: "90001"
    },
    price: 450000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1800,
    description: "Beautiful home in great neighborhood",
    images: ["url1.jpg", "url2.jpg"],
    status: "active"  // or "pending", "sold"
});

if (result.success) {
    console.log("Property ID:", result.propertyId);
    // Property automatically assigned to logged-in agent
    // Business metrics updated automatically!
} else {
    console.error("Error:", result.error);
}
```

### 2. Update Property

```javascript
const result = await propertyService.updateProperty(propertyId, {
    price: 475000,
    status: "pending",
    description: "Updated description"
});

if (result.success) {
    console.log("Property updated!");
    // Cloud Function triggers automatically
    // Metrics updated if status changed
} else {
    console.error("Error:", result.error);
}
```

### 3. Delete Property

```javascript
const result = await propertyService.deleteProperty(propertyId);

if (result.success) {
    console.log("Property deleted!");
    // Business metrics decremented automatically
} else {
    console.error("Error:", result.error);
}
```

### 4. Get My Properties

```javascript
// Get all your properties
const result = await propertyService.getMyProperties();

if (result.success) {
    console.log("My properties:", result.properties);
    // Properties are sorted by creation date (newest first)
}

// Get only active listings
const activeResult = await propertyService.getMyProperties({ 
    status: "active" 
});

// Limit results
const recentResult = await propertyService.getMyProperties({ 
    limit: 10 
});
```

### 5. Real-Time Updates (Bonus!)

```javascript
// Subscribe to real-time property updates
const unsubscribe = propertyService.subscribeToMyProperties((properties) => {
    console.log("Properties updated:", properties);
    // Update your UI here
    displayProperties(properties);
});

// Later, cleanup when done
unsubscribe();
```

---

## Security

### Automatic Protections

1. **Authentication Required** - Must be logged in
2. **Agent Role Check** - Must have 'agent' role
3. **Ownership Verification** - Can only modify own properties
4. **Admin Override** - Admins can modify any property

### Behind the Scenes

```javascript
// Cloud Function automatically adds:
propertyData.agentId = currentUser.uid;
propertyData.agentName = currentUser.displayName;

// When updating/deleting, verifies:
if (property.agentId !== currentUser.uid && user.role !== 'admin') {
    throw new Error('Permission denied');
}
```

---

## Integration with Agent Portal

### Example: Add Property Form

```html
<form id="addPropertyForm">
    <input name="street" placeholder="Street Address" required>
    <input name="city" placeholder="City" required>
    <input name="state" placeholder="State" required>
    <input name="zip" placeholder="ZIP" required>
    <input name="price" type="number" placeholder="Price" required>
    <input name="bedrooms" type="number" placeholder="Bedrooms" required>
    <input name="bathrooms" type="number" placeholder="Bathrooms" required>
    <textarea name="description" placeholder="Description"></textarea>
    <button type="submit">Add Property</button>
</form>

<script>
const form = document.getElementById('addPropertyForm');
const propertyService = new AgentPropertyService();

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const propertyData = {
        address: {
            street: formData.get('street'),
            city: formData.get('city'),
            state: formData.get('state'),
            zip: formData.get('zip')
        },
        price: parseFloat(formData.get('price')),
        bedrooms: parseInt(formData.get('bedrooms')),
        bathrooms: parseInt(formData.get('bathrooms')),
        description: formData.get('description'),
        status: 'active'
    };
    
    const result = await propertyService.createProperty(propertyData);
    
    if (result.success) {
        alert('Property added successfully!');
        form.reset();
    } else {
        alert('Error: ' + result.error);
    }
});
</script>
```

---

## Automatic Metrics Updates

When you create/update/delete properties through this API, **business metrics update automatically**:

```javascript
// Agent creates property
await propertyService.createProperty(data);

// Cloud Function onPropertyCreated fires
// Updates: business_metrics.properties.total++
// Updates: business_metrics.properties.active++
// Logs: business_activity collection

// Dashboard updates in real-time (< 1 second)
```

---

## API vs Direct Firestore

### ✅ Use AgentPropertyService (Recommended)

- Handles authentication automatically
- Enforces security rules
- Validates permissions
- Triggers metrics updates
- Easy error handling

### ❌ Don't Use Direct Firestore Writes

```javascript
// DON'T DO THIS - bypasses security checks
db.collection('properties').add(data);  // ❌
```

---

## File Upload (Images)

For property images, use Firebase Storage:

```javascript
// 1. Upload image to Storage
const file = document.getElementById('fileInput').files[0];
const storageRef = firebase.storage().ref(`properties/${propertyId}/${file.name}`);
await storageRef.put(file);
const imageUrl = await storageRef.getDownloadURL();

// 2. Update property with image URL
await propertyService.updateProperty(propertyId, {
    images: [imageUrl]
});
```

---

## Testing

### Test in Browser Console

```javascript
// Initialize
const service = new AgentPropertyService();
await service.initialize();

// Create test property
const result = await service.createProperty({
    address: { street: "Test St", city: "LA", state: "CA", zip: "90001" },
    price: 100000,
    bedrooms: 2,
    bathrooms: 1
});

console.log(result);

// Check Firebase Console
// - See property in 'properties' collection
// - See metrics updated in 'business_metrics/current'
// - See activity logged in 'business_activity'
```

---

## Error Handling

```javascript
const result = await propertyService.createProperty(data);

if (!result.success) {
    switch(result.error) {
        case 'User not authenticated':
            // Redirect to login
            window.location = '/auth/login.html';
            break;
            
        case 'Only agents can create properties':
            // Show error message
            alert('You must be an agent to create properties');
            break;
            
        default:
            // Generic error
            console.error('Unexpected error:', result.error);
    }
}
```

---

## Next Steps

1. ✅ Cloud Functions deployed
2. ✅ AgentPropertyService created
3. **Update `/agent/listings.html`** to use the service
4. **Add property form** with file upload
5. **Test** creating/updating properties

Now agents have full control over their property listings with automatic tracking and real-time updates! 🎉
