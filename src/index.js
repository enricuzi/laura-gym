import React from 'react'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import store from './store';
import {BrowserRouter, Switch, Route} from 'react-router-dom';
import HomePage from './containers/HomePage'
import RoomPage from './containers/RoomPage'
import NotFound from './components/NotFound'
import styles from './app.css'

render(
	<Provider store={store}>
		<BrowserRouter>
			<Switch>
				<Route exact path="/" component={HomePage}/>
				<Route path="/r/:room" component={RoomPage}/>
				<Route path="*" component={NotFound}/>
			</Switch>
		</BrowserRouter>
	</Provider>,
	document.getElementById('app')
);
