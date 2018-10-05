import React from 'react'
import { Link } from 'gatsby'

const Menu = () => (
    <div style={{
        background:'#E0E0E0',
        paddingTop: '13.3px',
    }}>

    <ul style={
        {
        listStyle: 'none',
        display: 'flex',
        justifyContent: 'space-evenly'
        }
    }>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/services">Services</Link></li>

    </ul>

    </div>
)

export default Menu;