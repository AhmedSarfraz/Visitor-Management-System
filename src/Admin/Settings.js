import React, {useEffect} from 'react'

function Settings({setActivePath}) {

    useEffect(()=>{
        setActivePath("Tickets")
    }, [])
    return (
        <div>
            Settings
        </div>
    )
}

export default Settings
