# Expense Fields Update TODO

- [x] Update schema.prisma to add purpose and event fields to Expense model
- [x] Run prisma migrate dev to create and apply migration
- [x] Update admin.js to include purpose and event in POST /expenses validation and creation
- [x] Update Expenses.jsx to add purpose and event inputs in the form, update formData state, and display them in the expense list
- [ ] Test the changes by running the app and adding an expense with all fields
