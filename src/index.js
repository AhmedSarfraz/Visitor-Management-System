import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from "@apollo/client";
import { setContext } from '@apollo/client/link/context';
import 'font-awesome/css/font-awesome.min.css';
import 'bootstrap/dist/css/bootstrap.css';
import './index.css';

const httpLink = createHttpLink({
  uri: `${process.env.REACT_APP_OFFICE_URL}/mobileql`,
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('office_vms_user');
  if(token){
    return {
      headers: {
        ...headers,
        authorization: `jwt ${token}`,
      }
    };
  }else{
    return headers;
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});
ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById('root')
);
// firebase init 
// firebase target:apply hosting office-checkin office-checkin
// firebase deploy --only hosting:office-checkin