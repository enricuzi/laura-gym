import React, {Component} from 'react'
import {Provider} from 'react-redux'
import store from './store';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import './app.css';
import HomePage from "./containers/HomePage";
import RoomPage from "./containers/RoomPage";
import Login from "./containers/Login";


export default class App extends Component {

	state = {
		roomId: "",
		isAuth: false
	};

	onRoomCreated = value => this.setState({roomId: value});

	render() {
		const {isAuth, roomId} = this.state;
		return (
			<Provider store={store}>
				<BrowserRouter>
					<Switch>
						<Route path="/r/:room" render={props => <RoomPage {...props} isAuth={isAuth}/>} roomId={roomId}/>
						<Route path="*" render={props => <HomePage {...props} isAuth={isAuth}/>}/>
					</Switch>
				</BrowserRouter>
			</Provider>
		)
	}
}
