# OpenConductor Admin Setup Guide

> **Your complete admin system is ready for launch week management**

## 🔑 **Your Admin Credentials**

**Admin API Key:** `oc_admin_78736a4a7469d09858a283a024a4de4a9f07025cb350a2282127a1412876acf2`

🔒 **Save this key securely!** This gives you full admin access to OpenConductor.

---

## 🚀 **How to Access Admin Interface**

### **Step 1: Set Your API Key**
Open your browser console and run:
```javascript
localStorage.setItem('admin-api-key', 'oc_admin_78736a4a7469d09858a283a024a4de4a9f07025cb350a2282127a1412876acf2')
```

### **Step 2: Access Admin Dashboard**
Visit: **http://localhost:3002/admin**

### **Step 3: Navigate Admin Sections**
- **Main Dashboard:** Overview of platform health and metrics
- **Server Management:** Add/edit MCP servers, verify submissions
- **Marketing Campaigns:** Launch announcements, partnership content
- **Roadmap Dashboard:** Track 3-month ecosystem strategy
- **Analytics:** Platform usage and ecosystem adoption

---

## 📦 **Server Management Features**

### **Manually Add MCP Servers**
1. Go to **http://localhost:3002/admin/servers**
2. Click "Add New Server"
3. Fill in server details:
   - Name, description, GitHub repo URL
   - Category, tags, installation command
   - Mark as verified/featured
4. CLI install command auto-generates: `openconductor install [slug]`

### **Bulk Import Servers**
```bash
# API endpoint for bulk GitHub import
POST /v1/admin/servers/bulk-import
Authorization: Bearer oc_admin_[your-key]

{
  "repositories": [
    "https://github.com/anthropic/filesystem-mcp",
    "https://github.com/anthropic/postgresql-mcp"
  ]
}
```

### **Server Verification Workflow**
- **Pending:** Community submitted, awaiting review
- **Verified:** Admin approved, available in CLI
- **Featured:** Highlighted on homepage and discovery

---

## 📢 **Marketing Campaign Management**

### **Access Campaign Manager**
Visit: **http://localhost:3002/admin/marketing**

### **Pre-Built Templates Available**
✅ **Product Hunt Launch** - Complete submission copy
✅ **Twitter Launch Thread** - 7-day progressive messaging  
✅ **Partnership Outreach** - Vercel, Supabase, v0, BaseHub
✅ **LinkedIn Announcements** - Professional ecosystem positioning

### **Launch Week Content Ready**
- **Saturday:** Product Hunt submission + npm messaging
- **Sunday-Tuesday:** Ecosystem integration showcases
- **Wednesday:** Platform benefits and metrics
- **Thursday-Friday:** Partnership announcements

---

## 📊 **Analytics & Ecosystem Tracking**

### **Key Metrics Dashboard**
- **Server adoption** by ecosystem (Vercel, Supabase, v0)
- **CLI installation** trends and geographic data
- **Marketing campaign** performance and conversion
- **Partnership outreach** response rates and engagement

### **Ecosystem KPIs**
Track these critical metrics for partnership conversations:
- **% of users deploying on Vercel** (target: 25%)
- **% using Supabase integration** (target: 30%)
- **% building with v0 components** (target: 15%)
- **Partnership inquiry volume** (target: 1+ per week)

---

## 🎯 **Launch Week Execution Checklist**

### **Saturday Launch Day**
- [ ] Product Hunt submission ready in campaign manager
- [ ] Social media content scheduled
- [ ] Monitor server additions and community submissions
- [ ] Track ecosystem adoption metrics in real-time

### **Post-Launch (Week 1)**
- [ ] Partnership outreach via campaign templates
- [ ] Add new servers discovered from community feedback
- [ ] Update ecosystem messaging based on adoption data
- [ ] Prepare enterprise case study materials

---

## 🔧 **Technical Admin Functions**

### **Server Database Operations**
```bash
# All admin API endpoints require your admin key
Authorization: Bearer oc_admin_78736a4a7469d09858a283a024a4de4a9f07025cb350a2282127a1412876acf2

# Server management
GET    /v1/admin/servers           # List all servers
POST   /v1/admin/servers           # Create new server  
PUT    /v1/admin/servers/:id       # Update server
DELETE /v1/admin/servers/:id       # Delete server

# Server actions
POST   /v1/admin/servers/:id/verify   # Verify server
POST   /v1/admin/servers/:id/feature  # Feature server

# Bulk operations
POST   /v1/admin/servers/bulk-import  # Import from GitHub URLs

# Analytics
GET    /v1/admin/stats              # Dashboard metrics
```

### **Marketing Content API**
```bash
# Campaign management (coming next)
GET    /v1/admin/campaigns          # List campaigns
POST   /v1/admin/campaigns          # Create campaign
PUT    /v1/admin/campaigns/:id      # Update campaign
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

**Q: Admin interface shows "API Key Required"**
A: Make sure you've set the localStorage key in browser console

**Q: Server creation fails**
A: Check that GitHub URL is valid and repository exists

**Q: CLI install command doesn't work**
A: Verify the server slug is unique and follows naming conventions

**Q: Marketing templates not loading**
A: Refresh the page and ensure admin API key is properly set

### **Database Health Check**
Your database is working correctly if you see:
- ✅ PostgreSQL client connected (in terminal logs)
- ✅ Server stats updating
- ✅ Background jobs processing

---

## 📈 **Next Steps for Launch**

### **Immediate (Today/Tomorrow)**
1. **Test admin interface** - Add a test server to verify functionality
2. **Prepare launch content** - Use marketing campaign templates
3. **Set up monitoring** - Watch ecosystem adoption metrics

### **Launch Day (Saturday)**
1. **Monitor submissions** - Community will submit servers via your interface  
2. **Verify quality** - Approve good servers for CLI installation
3. **Track partnerships** - Monitor referral traffic from ecosystem platforms
4. **Content management** - Use campaign manager for launch announcements

### **Post-Launch (Week 1+)**
1. **Partnership outreach** - Use pre-built templates for Vercel, Supabase, etc.
2. **Server growth** - Leverage bulk import for rapid ecosystem expansion
3. **Metrics reporting** - Show ecosystem adoption to potential partners
4. **Enterprise preparation** - Use analytics for funding/partnership conversations

---

## ✅ **Admin System Complete**

🎯 **You now have:**
- ✅ Complete server management (add/edit/delete/verify)
- ✅ Marketing campaign system with launch week content
- ✅ Ecosystem tracking and partnership metrics
- ✅ Professional admin interface for launch management
- ✅ API key authentication with full permissions

**Ready for Saturday launch with complete admin control!**

---

*For technical support: Check terminal logs and database connection status*
*For launch questions: Use the marketing campaign manager and ecosystem templates*