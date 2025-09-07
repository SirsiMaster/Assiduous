# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## ⚠️  CRITICAL DEVELOPMENT GOVERNANCE RULES (MUST FOLLOW)

### **RULE 1: ALWAYS CHECK EXISTING DOCUMENTATION FIRST**
**Before starting ANY task, you MUST:**
- Read and understand ALL existing project documentation
- Verify what functionality already exists and is working
- Check against established project plans and architecture
- Ensure you're not duplicating work or breaking existing functionality
- Review similar implementations that already exist in the project
- **NEVER modify or break existing working files without explicit instruction**

### **RULE 2: MANDATORY COMPLETION VERIFICATION**
**Before reporting ANY task as complete, you MUST:**
- Run the completion verification script: `./scripts/verify_completion.sh`
- Test all functionality you claim to have implemented
- Verify that claimed changes actually exist in the files
- Confirm that all components/pages work as specified
- Check that nothing existing was broken by your changes
- **NEVER report completion without running verification**

### **RULE 3: VALIDATE GROUND TRUTH**
**After completing ANY development work, you MUST:**
- Test all implemented functionality against the project requirements
- Update development documentation to reflect current reality
- Ensure analytics and dashboards show accurate current status
- Report the true development status, not assumptions
- Validate that the project state matches what you report
- **The documentation and dashboards must reflect ground truth, always**

**These rules apply to ALL repositories and ALL development work, current and future.**

---

## Project-Specific Configuration

[Add your project-specific WARP configuration below this line]

### Essential Commands
```bash
# Add your project's key commands here
```

### Architecture Overview
[Describe your project's architecture]

### Development Workflow
[Describe your development process]

### Deployment Process
[Describe how deployments work]

### Testing Strategy
[Describe how to test the project]

---

## Completion Verification Script

Every repository MUST have a `scripts/verify_completion.sh` script that validates development work before completion is reported. This script should check:

1. **File Integrity**: All files have valid syntax and structure
2. **Feature Implementation**: Claimed functionality actually works
3. **Integration**: Components work together properly
4. **Documentation**: Documentation reflects current state
5. **Testing**: All tests pass and new functionality is tested
6. **Project Standards**: Code follows project conventions

The verification script template can be found in the Assiduous repository and should be adapted for each project's specific needs.

## Universal Standards

These standards apply to ALL projects:

### Code Quality
- All code must pass syntax validation
- Follow established coding conventions
- Include appropriate error handling
- Document complex functionality

### Documentation
- Keep all documentation current and accurate
- Document architectural decisions
- Maintain change logs
- Update README files when functionality changes

### Version Control
- Use conventional commit messages
- Create meaningful branch names
- Keep commit history clean
- Tag releases appropriately

### Security
- Never commit sensitive information
- Follow security best practices
- Validate all user inputs
- Use secure communication protocols

**Remember: These governance rules exist to prevent development failures, ensure quality, and maintain project integrity. They are not optional.**
