import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { collection, getDocs, query, where, updateDoc, doc, onSnapshot, orderBy } from "firebase/firestore";
import { db, addPrefix } from './firebase';
import Admin from './Admin/Admin';
import Agent from './Agent/Agent';
import Checkin from './Checkin/Checkin';
import { useQuery } from '@apollo/client';
import Login from './Login/Login';
import gql from "graphql-tag";
import ErrorModal from './Components/ErrorModal';
import QueueContainer from './Agent/QueueContainer';

const USER_QUERY = gql`query CurrentUser{
  currentUser{
    id
    username
    groupNames
  }  
}`;

function App() {
  const [currentUser, setCurrentUser] = useState({id: null, pk: null, token: localStorage.getItem('office_vms_user'), groupNames:null, username:null, status:null})
  const [allAgents, setAllAgents] = useState([]);
  const [activeDrivers, setActiveDrivers] = useState([])
  const [newDrivers, setNewDrivers] = useState([])
  const [allLocations, setAllLocations] = useState([]);
  const [allLanguages, setAllLanguages] = useState([]);
  const [allDepartments, setAllDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
 
  useQuery(USER_QUERY, {
    skip: !currentUser.id || !currentUser.pk || !currentUser.token,
    onError: (err)=>{setLoading(false); setError(err)},
    onCompleted: async(response) => {
      if (response && response.currentUser && response.currentUser.groupNames) {
        setCurrentUser({...currentUser, groupNames:response.currentUser.groupNames, username:response.currentUser.username })
        setLoading(false)
      }
    }
  });

  const handleLogout = async() => {
    try {
      if(currentUser.pk){
        if (activeDrivers.filter(driver=> driver.agent == currentUser.pk && driver.status == "assigned").length > 0) {
          setError('Error: Please complete the assigned task in order to logout!')
          return
        }
        
        await updateDoc(doc(db, addPrefix("users"), String(currentUser.pk)), {
          status: "inactive",
          location: null
        });
      }
      handleLogout();
    } catch (err) {
      setError("Error: Unable to logout user!")
    }

    await localStorage.removeItem('office_vms_user')
    window.location.reload(false);
  }

  const getUser = async() =>{
    setLoading(true)
    if(currentUser.token){
      const querySnapshot = await getDocs(query(collection(db, addPrefix("users")), where("token", "==", currentUser.token)))
      let tmp = true
      await querySnapshot?.forEach((doc) => {
        tmp = false;
        let data = doc.data()
        setCurrentUser({...currentUser, id:data.userId, pk:data.userPk, status:data.status, location:data.location, isAgent: data.isAgent, language: data.language})
      });
      if(tmp) handleLogout()
    }else{
      setCurrentUser({id:null, pk:null, token:null, groupNames:null, username: null, status:null})
      setLoading(false)
    }
  }

  //To get all languages
  const loadLanguages = async() => {
    const querySnapshot = await getDocs(query(collection(db, addPrefix("languages"))))
    setAllLanguages(querySnapshot.docs.map((doc) => ({...doc.data(), firebaseId: doc.id}) ));
  }
  //To get all locations
  const loadLocations = async() => {
    const querySnapshot = await getDocs(query(collection(db, addPrefix("locations"))))
    setAllLocations(querySnapshot.docs.map((doc) => ({...doc.data(), firebaseId: doc.id}) ));
  }
  //To get all Department
  const loadDepartments = async() => {
    const querySnapshot = await getDocs(query(collection(db, addPrefix("departments"))))
    setAllDepartments(querySnapshot.docs.map((doc) => ({...doc.data(), firebaseId: doc.id}) ));
  }

  useEffect(() => {
    if(allLanguages.length == 0) loadLanguages()
    if(allLocations.length == 0) loadLocations()
    if(allDepartments.length == 0) loadDepartments()
  }, [])

  useEffect(() => {
    getUser()
  }, [currentUser.token])

  //To get all users/agents
  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, addPrefix("users"))), (querySnapshot) => {
        setAllAgents(querySnapshot.docs.map(doc => ({...doc.data(), firebaseId: doc.id }) ))
    });
    return () => unsubscribe()
  }, [])

  //To get all drivers
  useEffect(() => {
      const unsubscribe = onSnapshot(query(collection(db, addPrefix("tickets")), where("status", "in", ["waiting", "assigned"]), orderBy("dateAdded", "asc")), (querySnapshot) => {
        let data = null, newTickets = []
        querySnapshot.docChanges().forEach((change) => {
          data = change.doc.data()
          if (change.type === "added" && data.status == "assigned")
              newTickets.push({ ...data, firebaseId: change.doc.id });
              setNewDrivers(newTickets)
        })
        setNewDrivers(newTickets)
        setActiveDrivers(querySnapshot.docs.map(doc => ({...doc.data(), firebaseId: doc.id }) ))
      });
      return () => unsubscribe()
  }, [])

  return (
    <div className="app">
      {error && error != "" && <ErrorModal open={!!error} handleClose={() => setError("")} message={error} />}
      <Router>
        <Switch>
          <Route exact path="/">
            <Checkin activeDrivers={activeDrivers} />
          </Route>
          <Route path="/admin">
            {currentUser && currentUser.id && currentUser.pk && currentUser.token && currentUser.groupNames && currentUser.groupNames.includes("VMS-Admin") && !currentUser.isAgent ?
              <Admin currentUser={currentUser} allAgents={allAgents} activeDrivers={activeDrivers} allLocations={allLocations} allLanguages={allLanguages} allDepartments={allDepartments} loadLocations={loadLocations} loadLanguages={loadLanguages} loadDepartments={loadDepartments} setCurrentUser={setCurrentUser} handleLogout={handleLogout}/> :
              currentUser && currentUser.id && currentUser.pk && currentUser.token && currentUser.groupNames && currentUser.isAgent ? 
                <Agent currentUser={currentUser} allAgents={allAgents} locations={allLocations} languages={allLanguages} activeDrivers={activeDrivers} newDrivers={newDrivers} setCurrentUser={setCurrentUser} handleLogout={handleLogout}/> :
                <Login />
            }
          </Route>
          <Route path="/queue">
            <QueueContainer height={"100vh"} allAgents={allAgents} activeDrivers={activeDrivers} newDrivers={newDrivers} key={456}/>
          </Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
