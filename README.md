# Visitor-Management-System
Visitor management is the process of tracking everyone who enters your building or your office. A visitor may be a customer, a delivery person, a job applicant, a contractor, a consultant, or any other person. Using this software you will be able to add the visitors in the queue, and the people from the operation can see who is in the queue and they can accept their tickets, in order to serve them.

## Required Files
1. firebase.json  
2. .env  
3. .env.production
4. ./src/assets/office-logo.svg

## End-Points
End-Point  | Description
---------- | -------------
[http://localhost:3000](http://localhost:3000) | Main page, where the visitor can put their details about the visit.
[http://localhost:3000/admin](http://localhost:3000/admin) | Admin portal where we can see all the data and set system attributes, like departments, users and reasons of visits etc.
[http://localhost:3000/queue](http://localhost:3000/queue) | Which can be displayed for the public, where they can see all the queues and their when is their turn etc.

### Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!