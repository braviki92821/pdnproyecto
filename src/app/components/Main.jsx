import React from 'react';
import {store} from "../store";
import {Provider} from 'react-redux';
import {ConnectedDashboard} from './Dashboard';
import {Router, Route} from "react-router-dom";
import {history} from "../store/history";
import {ConnectedNavigation} from "./Navigation";
import {ConnectTaskDetail} from "./TaskDetail";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import {LoadFileV} from "./UploadFile/LoadFileV";
    import { Redirect } from 'react-router';

const theme = createMuiTheme({
    typography: {
        useNextVariants: true,
        fontFamily: ["Noto Sans SC", '"Helvetica"', '"Arial"', '"sans-serif"'].join(","),
    },
    palette: {
        primary: {
            main: "#00695c",
            light: "#439889",
            dark: "#003d33",
            contrastText: "#ffffff"
        },
        secondary: {
            main: "#0097a7",
            light: "#56c8d8",
            dark: "#006978",
            contrastText: "#000000"
        },
        white: "#ffffff",
        grey: {
            dark: "#666666",
            light: "#f2f2f2"
        },
        contrastThreshold: 3,
    },
});



const RouteGuard = Component =>({match})=>{
    if(!store.getState().session.authenticated ){
        return <Redirect to="/"/> ;
    }else{
        return <Component match={match}/>;
    }
}

export const Main = ()=> (
    <Router history={history}>
        <Provider store = {store}>
            <div>
                <ConnectedNavigation/>
                <Route exact
                       path="/dashboard"
                       render= {()=>(<ConnectedDashboard/>) }
                />
                <Route exact
                       path = "/task/:id"
                       render = {({match}) => <ConnectTaskDetail match={match} />}

                />
                <Route exact
                       path= "/uploadFile"
                       render={() => (<LoadFileV/>)}
                />
            </div>
        </Provider>
    </Router>
)
