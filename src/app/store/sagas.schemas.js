import { take, put, select } from 'redux-saga/effects';
import uuid from 'uuid';
import axios from 'axios';
import * as mutations from './mutations';
import path from "path";
import moment from 'moment'
import {alertActions} from "../_actions/alert.actions";
import {history} from "./history";
import {userConstants} from "../_constants/user.constants";
import {userActions} from "../_actions/user.action";
import {providerConstants} from "../_constants/provider.constants";
import {providerActions} from "../_actions/provider.action";
import {REQUEST_TOKEN_AUTH, requestTokenAuth, REQUEST_RESET_PASSWORD} from "./mutations";
import {catalogConstants} from "../_constants/catalogs.constants";
import {catalogActions} from "../_actions/catalog.action";
import {S2Constants} from "../_constants/s2.constants";
import {storeValidate} from "./index";
import {S2Actions} from "../_actions/s2.action";
import {bitacoraActions} from "../_actions/bitacora.action";
import {S3SConstants} from "../_constants/s3s.constants";
import {S3SActions} from "../_actions/s3s.action";
const qs = require('querystring')
const jwt = require('jsonwebtoken');
const _ = require('underscore');
import { formatISO } from 'date-fns'


const host = process.env.URLAPI;
const urOauth2 = host+process.env.PORTOAUTH
const ur= host+process.env.PORTAPI;
const clientId = process.env.CLIENTID;
const clientSecret = process.env.CLIENTSECRET;


export function* validationErrors(){
    while (true) {
        const {schema,systemId} = yield take (mutations.REQUEST_VALIDATION_ERRORS);
        const token = localStorage.token;
        console.log("token"+token);
        console.log("system"+systemId);
        if(token){
            let payload = jwt.decode(token);
            yield put (userActions.setUserInSession(payload.idUser));
            var usuario=payload.idUser;

            if(systemId === "S2"){
                try{
                    let SCHEMA = JSON.parse(schema);
                    let respuestaArray;

                    respuestaArray = yield axios.post(ur + `/validateSchemaS2`,SCHEMA, { headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'usuario':usuario
                        }});

                    if(respuestaArray.data.Status === 500){
                        console.log(respuestaArray.data.response);
                        yield put(mutations.setErrorsValidation(respuestaArray.data.response));
                        yield put(alertActions.error("No se realizó el registro ya que se encontraron errores en la validación, favor de verificar"));
                    }else{
                        let numeroRegistros= respuestaArray.data.detail.numeroRegistros;
                        yield put(alertActions.success("Se insertaron "+ numeroRegistros+" registros correctamente"));
                    }
                }catch (e) {
                    yield put(alertActions.error("Error encontrado en sintaxis del archivo Json "+ e));
                }
            }else if(systemId === "S3S"){
                try{
                    let SCHEMA = JSON.parse(schema);
                    let respuestaArray;

                    respuestaArray = yield axios.post(ur + `/validateSchemaS3S`,SCHEMA, { headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'usuario':usuario
                        }});

                    if(respuestaArray.data.Status === 500){
                        console.log(respuestaArray.data.response);
                        yield put(mutations.setErrorsValidation(respuestaArray.data.response));
                        yield put(alertActions.error("No se realizó el registro ya que se encontraron errores en la validación, favor de verificar"));
                    }else{
                        let numeroRegistros= respuestaArray.data.detail.numeroRegistros;
                        yield put(alertActions.success("Se insertaron "+ numeroRegistros+" registros correctamente"));
                    }
                }catch (e) {
                    yield put(alertActions.error("Error encontrado en sintaxis del archivo Json "+ e));
                }
            }
        }else{
            console.log("error in token");
        }
    }
}

export function* requestUserPerPage(){
    while (true) {
        const {objPaginationReq} = yield take(userConstants.USERS_PAGINATION_REQUEST);
        const token = localStorage.token;
        const respuestaArray = yield axios.post(ur + `/getUsersFull`,objPaginationReq,{ headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            }});
        yield put(userActions.setPerPageSucces(respuestaArray.data.results));

    }
}


export function* requestProviderPerPage(){
    while (true) {
        const {objPaginationReq} = yield take(providerConstants.PROVIDERS_PAGINATION_REQUEST);
        const token = localStorage.token;
        let payload = jwt.decode(token);
        yield put (userActions.setUserInSession(payload.idUser));
        let query = { "usuario":payload.idUser};
        const respuestaArray = yield axios.post(ur + `/getProvidersFull`,objPaginationReq, {headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            }});
        yield put(providerActions.setPerPageSucces(respuestaArray.data.results));
        
    }
}

export function* fillTemporalUser(){
    while (true) {
        const {id} = yield take(userConstants.USER_TEMPORAL_REQUEST);
        const token = localStorage.token;
        if(token){
            let query = {"query" : {"_id" : id}};
            const respuestaArray = yield axios.post(ur + `/getUsers`, query, { headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'Authorization': `Bearer ${token}`
                }});
            yield put(userActions.setPerPageSucces(respuestaArray.data.results));
        }
    }
}

export function* fillTemporalProvider(){
    while (true) {
        const {id} = yield take(providerConstants.PROVIDER_TEMPORAL_REQUEST);
        const token = localStorage.token;
        if(token){
            let query = {"query" : {"_id" : id}};
            const respuestaArray = yield axios.post(ur + `/getProviders`, query,{ headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'Authorization': `Bearer ${token}`
                }});
            yield put(providerActions.setPerPageSucces(respuestaArray.data.results));
        }
    }
}

export function* fillAllProviders(){
    while (true){
        yield take(providerConstants.PROVIDERS_GETALL);

        const token = localStorage.token;
        let payload = jwt.decode(token);
        yield put (userActions.setUserInSession(payload.idUser));
        let query = { "usuario":payload.idUser};

            const respuestaArray = yield axios.post(ur + `/getProvidersFull`,query,{ headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'Authorization': `Bearer ${token}`
                }});
            yield put(providerActions.setProvidersAll(respuestaArray.data.results));
    }
}

export function* fillAllUsers(){
    while (true){
        yield take(userConstants.USERS_GETALL);

        const token = localStorage.token;
        let payload = jwt.decode(token);
        yield put (userActions.setUserInSession(payload.idUser));
        let query = { "usuario":payload.idUser};

        const respuestaArray = yield axios.post(ur + `/getUsersAll`,query,{ headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            }});
        respuestaArray.data.results.push({label: "NINGUNO", value:""});
        yield put(userActions.setUsersAll(respuestaArray.data.results));
    }
}


export function* deleteUser(){
    while (true) {
        const {id} = yield take (userConstants.DELETE_REQUEST);
        const token = localStorage.token;
        if(token){
            let request = {"_id": id};
            try{
                let payload = jwt.decode(token);
                yield put (userActions.setUserInSession(payload.idUser))
                console.log(payload.idUser);
                let request = {"_id": id,"user":payload.idUser};
                const {status} = yield axios.delete(ur + `/deleteUser`, { data : {request} , headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'Authorization': `Bearer ${token}`
                    } , validateStatus: () => true});
                if(status === 200){
                    yield put(userActions.deleteUserDo(id));
                    yield put(alertActions.success("Se elimino el usuario con exito"));
                }else{
                    //error in response
                    yield put(alertActions.error("El usuario NO fue eliminado"));
                }
            }catch (e) {
                yield put(alertActions.error("El usuario NO fue eliminado"));
            }
        }


    }
}

export function* deleteProvider(){
    while (true) {
        const {id} = yield take (providerConstants.DELETE_REQUEST);
        const token = localStorage.token;
        let payload = jwt.decode(token);
        yield put (userActions.setUserInSession(payload.idUser))
        let request = {"_id": id,"usuario":payload.idUser};
        const {status} = yield axios.delete(ur + `/deleteProvider`, { data : {request} ,headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            },validateStatus: () => true});
        if(status === 200){
            yield put(providerActions.deleteProviderDo(id));
            yield put(alertActions.success("Proveedor eliminado con exito"));
        }else{
            //error in response
        }
    }
}

export function* loginUser(){
    while (true){
        const {credentialUser} = yield take (mutations.REQUEST_TOKEN_AUTH);
        let userName = credentialUser.username;
        let password = credentialUser.password;

        const requestBody = {
            client_id: clientId,
            grant_type: 'password',
            username: userName,
            password: password,
            client_secret: clientSecret
        }

        try{
            const token = yield axios.post(urOauth2 + `/oauth/token`, qs.stringify(requestBody), { headers: {validateStatus: () => true ,'Content-Type': 'application/x-www-form-urlencoded' } });
            localStorage.setItem("token", token.data.access_token);
            history.push('/usuarios');
        }catch (err) {
            if(err.response){
                yield put(alertActions.error(err.response.data.message));
            }else{
                yield put(alertActions.error(err.toString()));
            }
        }
    }
}

export function* verifyTokenGetUser(){
    while(true){
        const {token} = yield take (userConstants.USER_REQUEST_SESSION_SET);
        let payload = jwt.decode(token);
        yield put (userActions.setUserInSession(payload.idUser))
        console.log(payload.idUser);
    }
}

export function* closeSession(){
    while (true){
        yield take (userConstants.USER_SESSION_REMOVE);
        localStorage.removeItem("token");
        history.push('/login');
    }
}

export function* creationUser(){
    while (true) {
        const {usuarioJson} = yield take (mutations.REQUEST_CREATION_USER);
        const token = localStorage.token;
        let payload = jwt.decode(token);
        yield put (userActions.setUserInSession(payload.idUser))
        console.log(payload.idUser);
        usuarioJson["user"]=payload.idUser;
        const {status} = yield axios.post(ur + `/create/user`,usuarioJson, {headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            } , validateStatus: () => true});
        if(status === 200){
            //all OK
            yield put(alertActions.success("Usuario creado con exito"));
            history.push('/usuarios');
            yield put(alertActions.clear());
        }else{
            //error in response
        }
    }
}



export function* editUser(){
    while (true) {
        const {usuarioJson} = yield take (mutations.REQUEST_EDIT_USER);
        let fechaActual = moment();
        const token = localStorage.token;
        let payload = jwt.decode(token);
        yield put (userActions.setUserInSession(payload.idUser))
        console.log(payload.idUser);
        usuarioJson["user"]=payload.idUser;
        const {status} = yield axios.put(ur + `/edit/user`,usuarioJson, {headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            } , validateStatus: () => true});
        if(status === 200){
            //all OK
            yield put(alertActions.success("Usuario creado con exito"));
            history.push('/usuarios');
            yield put(alertActions.clear());
        }else{
            //error in response
        }
    }
}


export function* creationProvider(){
    while(true){
        const {usuarioJson} = yield take (mutations.REQUEST_CREATION_PROVIDER);
        let fechaActual =moment();
        if(usuarioJson["estatus"]==undefined || usuarioJson["estatus"]==null){
            usuarioJson["estatus"]=true;
            usuarioJson["fechaAlta"]=fechaActual.format();
        }else{
            usuarioJson["fechaActualizacion"]=fechaActual.format();
        }
        const token = localStorage.token;
        //const {token} = yield take (userConstants.USER_REQUEST_SESSION_SET);
        let payload = jwt.decode(token);
        yield put (userActions.setUserInSession(payload.idUser))
        usuarioJson["usuario"]=payload.idUser;
        const {status}  =yield axios.post(ur + `/create/provider`, usuarioJson, {headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            } ,validateStatus: () => true});
        if(status === 200){
            //all OK
            yield put(alertActions.success("Proovedor creado con exito"));
        }else{
            //error in response
        }

    }
}

export function* editProvider(){
    while(true){
        const {usuarioJson} = yield take (mutations.REQUEST_EDIT_PROVIDER);
        let fechaActual =moment();
        if(usuarioJson["estatus"]==undefined || usuarioJson["estatus"]==null){
            usuarioJson["estatus"]=true;
            usuarioJson["fechaAlta"]=fechaActual.format();
        }else{

            usuarioJson["fechaActualizacion"]=fechaActual.format();
        }
        const token = localStorage.token;
        let payload = jwt.decode(token);
        yield put (userActions.setUserInSession(payload.idUser));
        usuarioJson["usuario"]=payload.idUser;
        const {status}  =yield axios.put(ur + `/edit/provider`, usuarioJson, {headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            } ,validateStatus: () => true});
        if(status === 200){
            //all OK
            yield put(alertActions.success("Proovedor creado con exito"));
        }else{
            //error in response
        }
    }
}

export function* getCatalogRamo(){
    while(true){
        const {docType} = yield take (catalogConstants.RAMO_REQUEST);
        const token = localStorage.token;

        const respuestaArray = yield axios.post(ur + `/getCatalogs`,{docType: docType},{ headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            }});

        respuestaArray.data.results.push({label: "NINGUNO", value:""});

        yield put (catalogActions.setRamoSucces(respuestaArray.data.results));

    }
}


export function* getCatalogGenero(){
    while(true){
        const {docType} = yield take (catalogConstants.GENERO_REQUEST);
        const token = localStorage.token;

        const respuestaArray = yield axios.post(ur + `/getCatalogs`,{docType: docType},{ headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            }});
        respuestaArray.data.results.push({label: "NINGUNO", value:""});
        yield put (catalogActions.setGeneroSucces(respuestaArray.data.results));
    }
}


export function* getCatalogPuesto(){
    while(true){
        const {docType} = yield take (catalogConstants.PUESTO_REQUEST);
        const token = localStorage.token;

        const respuestaArray = yield axios.post(ur + `/getCatalogs`,{docType: docType},{ headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            }});

        respuestaArray.data.results.push({label: "NINGUNO", value:""});
        yield put (catalogActions.setPuestoSucces(respuestaArray.data.results));
    }
}


export function* getCatalogTipoArea(){
    while(true){
        const {docType} = yield take (catalogConstants.TIPO_AREA_REQUEST);
        const token = localStorage.token;

        const respuestaArray = yield axios.post(ur + `/getCatalogs`,{docType: docType},{ headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            }});

        respuestaArray.data.results.push({label: "NINGUNO", value:""});
        yield put (catalogActions.setTipoAreaSucces(respuestaArray.data.results));
    }
}

export function* getCatalogNivelResponsabilidad(){
    while(true){
        const {docType} = yield take (catalogConstants.NIVEL_RESPONSABILIDAD_REQUEST);
        const token = localStorage.token;

        const respuestaArray = yield axios.post(ur + `/getCatalogs`,{docType: docType},{ headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            }});
        respuestaArray.data.results.push({label: "NINGUNO", value:""});
        yield put (catalogActions.setNivelResponsabilidadSucces(respuestaArray.data.results));
    }
}

export function* getCatalogTipoProcedimiento(){
    while(true){
        const {docType} = yield take (catalogConstants.TIPO_PROCEDIMIENTO_REQUEST);
        const token = localStorage.token;

        const respuestaArray = yield axios.post(ur + `/getCatalogs`,{docType: docType},{ headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            }});
       // respuestaArray.data.results.push({label: "NINGUNO", value:""});
        yield put (catalogActions.setTipoProcedimientoSucces(respuestaArray.data.results));
    }
}

// ----------------------------------------------- catalogos S3S


export function* getCatalogTipoFalta(){
    while(true){
        const {docType} = yield take (catalogConstants.TIPO_FALTA_REQUEST);
        const token = localStorage.token;

        const respuestaArray = yield axios.post(ur + `/getCatalogs`,{docType: docType},{ headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            }});
        respuestaArray.data.results.push({label: "NINGUNO", value:""});
        yield put (catalogActions.setTipoFaltaSucces(respuestaArray.data.results));
    }
}

export function* getCatalogTipoSancion(){
    while(true){
        const {docType} = yield take (catalogConstants.TIPO_SANCION_REQUEST);
        const token = localStorage.token;

        const respuestaArray = yield axios.post(ur + `/getCatalogs`,{docType: docType},{ headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            }});

        yield put (catalogActions.setTipoSancionSucces(respuestaArray.data.results));
    }
}

export function* getCatalogMoneda(){
    while(true){
        const {docType} = yield take (catalogConstants.MONEDA_REQUEST);
        const token = localStorage.token;

        const respuestaArray = yield axios.post(ur + `/getCatalogs`,{docType: docType},{ headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            }});

        yield put (catalogActions.setMonedaSucces(respuestaArray.data.results));
    }
}


export function* getCatalogTipoDocumento(){
    while(true){
        const {docType} = yield take (catalogConstants.TIPO_DOCUMENTO_REQUEST);
        const token = localStorage.token;

        const respuestaArray = yield axios.post(ur + `/getCatalogs`,{docType: docType},{ headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            }});
        respuestaArray.data.results.push({label: "NINGUNO", value:""});
        yield put (catalogActions.setTipoDocumentoSucces(respuestaArray.data.results));
    }
}



export function* creationS3SSchema(){
    while (true) {
        const {values} = yield take (S3SConstants.REQUEST_CREATION_S3S);
        const token = localStorage.token;
        let payload = jwt.decode(token);
        yield put (userActions.setUserInSession(payload.idUser));
        let usuario=payload.idUser;

        let docSend={};
        if (values.expediente) {
            docSend["expediente"] = values.expediente;
        }

        //-----------------INSTITUCION DEPENDENCIA
        let ObjInstitucionDepe = {};
        if (values.idnombre) {
            ObjInstitucionDepe = {...ObjInstitucionDepe, nombre: values.idnombre}
        }
        if (values.idclave) {
            ObjInstitucionDepe = {...ObjInstitucionDepe, clave: values.idclave}
        }
        if (values.idsiglas) {
            ObjInstitucionDepe = {...ObjInstitucionDepe, siglas: values.idsiglas}
        }
        docSend["institucionDependencia"] = ObjInstitucionDepe;

        //----------------SERVIDOR PUBLICO SANCIONADO

        let ObjServidorSancionado = {};
        if (values.SPSnombres) {
            ObjServidorSancionado = {...ObjServidorSancionado, nombres: values.SPSnombres}
        }
        if (values.SPSprimerApellido) {
            ObjServidorSancionado = {...ObjServidorSancionado, primerApellido: values.SPSprimerApellido}
        }
        if (values.SPSsegundoApellido) {
            ObjServidorSancionado = {...ObjServidorSancionado, segundoApellido: values.SPSsegundoApellido}
        }
        if (values.SPSgenero) {
            let genero = JSON.parse(values.SPSgenero);
            ObjServidorSancionado = {...ObjServidorSancionado, genero: {clave: genero.clave, valor: genero.valor}}
        }
        if (values.SPSpuesto) {
            ObjServidorSancionado = {...ObjServidorSancionado, puesto: values.SPSpuesto}
        }
        if (values.SPSnivel) {
            ObjServidorSancionado = {...ObjServidorSancionado, nivel: values.SPSnivel}
        }

        docSend["servidorPublicoSancionado"] = ObjServidorSancionado;

        //-----------------

        if (values.autoridadSancionadora) {
            docSend["autoridadSancionadora"] = values.autoridadSancionadora;
        }

        //----------------- TIPO FALTA

        let ofalta={};
        if (values.tipoFalta) {
            let falta = JSON.parse(values.tipoFalta);
            let ofalta = {clave: falta.clave, valor: falta.valor};
            if (values.tpfdescripcion) {
                ofalta = {...ofalta, descripcion: values.tpfdescripcion}
            }
        }
        docSend["tipoFalta"] = ofalta;


        if (values.causaMotivoHechos) {
            docSend["causaMotivoHechos"] = values.causaMotivoHechos;
        }

        //-----------------RESOLUCION
        let ObjResolucion = {};
        if (values.resolucionURL) {
            ObjResolucion = {...ObjResolucion, url: values.resolucionURL}
        }
        if (values.resolucionFecha) {
            let fecha = Date.parse(values.resolucionFecha);
            fecha = formatISO(fecha, { representation: 'date' });
            ObjResolucion = {...ObjResolucion, fechaResolucion: fecha}
        }
        docSend["resolucion"] = ObjResolucion;

        //-----------------MULTA
        let ObjMulta = {};
        if (values.multaMonto) {
            ObjMulta = {...ObjMulta, monto: parseFloat(values.multaMonto)}
        }
        if (values.multaMoneda) {
            let multaMoneda = JSON.parse(values.multaMoneda);
            ObjMulta = {...ObjMulta, moneda: {clave: multaMoneda.clave, valor: multaMoneda.valor}}
        }
        docSend["multa"] = ObjMulta;

        //-------------------INHABILITACION
        let ObjInhabilita = {};
        if (values.inhabilitacionPlazo) {
            ObjInhabilita = {...ObjInhabilita, plazo: values.inhabilitacionPlazo}
        }
        if (values.inhabilitacionFechaInicial) {
            let fecha = Date.parse(values.inhabilitacionFechaInicial);
            fecha = formatISO(fecha, { representation: 'date' });
            ObjInhabilita = {...ObjInhabilita, fechaInicial: fecha}
        }
        if (values.inhabilitacionFechaFinal) {
            let fecha = Date.parse(values.inhabilitacionFechaFinal);
            fecha = formatISO(fecha, { representation: 'date' });
            ObjInhabilita = {...ObjInhabilita, fechaFinal: fecha}
        }

        docSend["inhabilitacion"] = ObjInhabilita;

        //-------------------
        if (values.observaciones) {
            docSend["observaciones"] = values.observaciones;
        }
        //-------------------DOCUMENTOS

        if (values.documents) {
            if (Array.isArray(values.documents)) {
                for (let i of values.documents) {
                    i.tipoDoc = JSON.parse(i.tipoDoc).clave;
                    let fecha = Date.parse(i.fecha);
                    i.fecha = formatISO(fecha, { representation: 'date' });
                }
            }
        }
        docSend["documentos"] = values.documents;

        const {status} = yield axios.post(ur + `/insertS3SSchema`,{...docSend, usuario:usuario}, {headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            } , validateStatus: () => true});
        if(status === 200){
            //all OK
            yield put(alertActions.success("Registro actualizado con exito "));
        }else{
            yield put(alertActions.error("Error al crear"));
            //error in response
        }

    }
}



export function* creationS2Schema(){
    while (true) {
        const {values} = yield take (S2Constants.REQUEST_CREATION_S2);
        let docSend = {};
        const token = localStorage.token;

        docSend["id"]= "FAKEID";
        docSend["fechaCaptura"]= moment().format();
        docSend["ejercicioFiscal"]= values.ejercicioFiscal;
         if(values.ramo){
             let ramoObj = JSON.parse(values.ramo);
             docSend["ramo"]= {clave:  parseInt(ramoObj.clave) , valor: ramoObj.valor };
         }
        docSend["nombres"]= values.nombres;
        docSend["primerApellido"] =values.primerApellido;
        docSend["segundoApellido"]= values.segundoApellido;
        if(values.genero){
            docSend["genero"]= JSON.parse(values.genero);
        }
        docSend["institucionDependencia"] = {nombre : values.idnombre , clave: values.idclave, siglas: values.idsiglas};
        docSend["puesto"]= {nombre: values.puestoNombre, nivel: values.puestoNivel};
       if(values.tipoArea){
           docSend["tipoArea"]=JSON.parse("["+values.tipoArea+"]");
       }
       if(values.tipoProcedimiento){
           let ObjTipoProcedimiento= JSON.parse("["+values.tipoProcedimiento+"]");
           docSend["tipoProcedimiento"]= getArrayFormatTipoProcedimiento(ObjTipoProcedimiento);
       }
       if(values.nivelResponsabilidad){
           docSend["nivelResponsabilidad"] = JSON.parse("[" + values.nivelResponsabilidad + "]");
       }

        docSend["superiorInmediato"]= {nombres: values.sinombres, primerApellido: values.siPrimerApellido, segundoApellido : values.siSegundoApellido,
        puesto: {nombre:values.siPuestoNombre, nivel: values.siPuestoNivel}};

        console.log(docSend);
        let payload = jwt.decode(token);
        yield put (userActions.setUserInSession(payload.idUser));
        let usuario=payload.idUser;
        docSend["usuario"]=usuario;

        const {status} = yield axios.post(ur + `/insertS2Schema`,docSend, {headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            } , validateStatus: () => true});
        if(status === 200){
            //all OK
            yield put(alertActions.success("Registro creado con exito "));
        }else{
            yield put(alertActions.error("Error al crear"));
            //error in response
        }

    }
}


export function* updateS2Schema(){
    while (true) {
        const {values} = yield take (S2Constants.UPDATE_REG_S2);
        const token = localStorage.token;
        let S2Item = storeValidate.getState().S2.find(reg=>reg._id === values._id);
        let payload = jwt.decode(token);
        yield put (userActions.setUserInSession(payload.idUser));
        let usuario=payload.idUser;

              const {status} = yield axios.post(ur + `/updateS2Schema`,{...values, fechaCaptura: S2Item.fechaCaptura,usuario:usuario}, {headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            } , validateStatus: () => true});
        if(status === 200){
            //all OK
            yield put(alertActions.success("Registro actualizado con exito "));
        }else{
            yield put(alertActions.error("Error al crear"));
            //error in response
        }

    }
}


function getArrayFormatTipoProcedimiento(array){
    _.each(array, function(p){
        p.clave = parseInt(p.clave);
    });
    return array;
}

export function* getListSchemaS2(){
    while(true){
        const {filters} = yield take (S2Constants.REQUEST_LIST_S2);
        const token = localStorage.token;

        const respuestaArray = yield axios.post(ur + `/listSchemaS2`,filters,{ headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            }});

        yield put (S2Actions.setListS2(respuestaArray.data.results));
        yield put (S2Actions.setpaginationS2(respuestaArray.data.pagination));

    }
}


export function* getListSchemaS3S(){
    while(true){
        const {filters} = yield take (S3SConstants.REQUEST_LIST_S3S);
        const token = localStorage.token;

        const respuestaArray = yield axios.post(ur + `/listSchemaS3S`,filters,{ headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            }});

        yield put (S3SActions.setListS3S(respuestaArray.data.results));
        console.log(respuestaArray.data.pagination);
        yield put (S3SActions.setpaginationS3S(respuestaArray.data.pagination));

    }
}



export function* fillUpdateRegS2(){
    while(true){
        const {id} = yield take (S2Constants.FILL_REG_S2_EDIT);
        const token = localStorage.token;
        let query = {"query" : {"_id" : id}};

        const respuestaArray = yield axios.post(ur + `/listSchemaS2`,query,{ headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            }});

        let registro = respuestaArray.data.results[0];

        let newRow={};
        for (let [key, row] of Object.entries(registro)) {

            if(key ===  "genero" || key === "ramo"){
                   newRow[key]=  JSON.stringify({clave:row.clave.toString() ,valor : row.valor});
            }else if(key === "tipoArea" || key === "nivelResponsabilidad" || key === "tipoProcedimiento") {
                let newArray=[];
                for(let item of row){
                    newArray.push(JSON.stringify({clave:item.clave.toString() ,valor : item.valor}));
                }
                newRow[key]= newArray;
            }else if (key === "superiorInmediato") {
                if(row.nombres){ newRow["sinombres"] = row.nombres ;}
                if(row.primerApellido){ newRow["siPrimerApellido"] = row.primerApellido;}
                if(row.segundoApellido){ newRow["siSegundoApellido"] = row.segundoApellido;}
                if(row.puesto){
                    if(row.puesto.nombre){ newRow["siPuestoNombre"] = row.puesto.nombre;}
                    if(row.puesto.nivel){ newRow["siPuestoNivel"] = row.puesto.nivel;}
                }
            } else if (key === "puesto" ) {
                if(row.nombre){ newRow["puestoNombre"] = row.nombre ; }
                if(row.nivel){newRow["puestoNivel"] = row.nivel ;}
            }else if(key === "institucionDependencia" ){
                if(row.nombre ){newRow["idnombre"] = row.nombre ;}
                if(row.siglas ){newRow["idsiglas"] = row.siglas ;}
                if(row.clave ){ newRow["idclave"] = row.clave ;}
            }else {
                newRow[key] = row ;
            }
        }
        yield put (S2Actions.setListS2([newRow]));
    }
}


export function* deleteSchemaS2(){
    while (true) {
        const {id} = yield take (S2Constants.DELETE_REQUEST);
        const token = localStorage.token;
        if(token){
            let request = {"_id": id};
            let payload = jwt.decode(token);
            yield put (userActions.setUserInSession(payload.idUser));
            request["usuario"]=payload.idUser;
            try{
                const {status, data} = yield axios.delete(ur + `/deleteRecordS2`, { data : {request} , headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'Authorization': `Bearer ${token}`
                    } , validateStatus: () => true});
                if(status === 200){
                    console.log("Response",  );
                    yield put(S2Actions.deleteRecordDo(id));
                    yield put(alertActions.success(data.messageFront));
                }else{
                    //error in response
                    yield put(alertActions.error("El Registro NO fue eliminado"));
                }
            }catch (e) {
                yield put(alertActions.error("El Registro NO fue eliminado"));
            }
        }


    }
}

export function* deleteSchemaS3S(){
    while (true) {
        const {id} = yield take (S3SConstants.DELETE_REQUEST);
        const token = localStorage.token;
        if(token){
            let request = {"_id": id};
            let payload = jwt.decode(token);
            yield put (userActions.setUserInSession(payload.idUser));
            request["usuario"]=payload.idUser;
            try{
                const {status, data} = yield axios.delete(ur + `/deleteRecordS3S`, { data : {request} , headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'Authorization': `Bearer ${token}`
                    } , validateStatus: () => true});
                if(status === 200){
                    console.log("Response",  );
                    yield put(S2Actions.deleteRecordDo(id));
                    yield put(alertActions.success(data.messageFront));
                }else{
                    //error in response
                    yield put(alertActions.error("El Registro NO fue eliminado"));
                }
            }catch (e) {
                yield put(alertActions.error("El Registro NO fue eliminado"));
            }
        }


    }
}

export function* consultBitacora(){
    while(true){
        const {usuarioJson} = yield take (mutations.REQUEST_CONSULT_BITACORA);
        let fechaActual =moment();
        const token = localStorage.token;
        let payload = jwt.decode(token);
        yield put (userActions.setUserInSession(payload.idUser));
        //usuarioJson["usuario"]=payload.idUser;
        const respuestaArray  =yield axios.post(ur + `/getBitacora`, usuarioJson, {headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${token}`
            } ,validateStatus: () => true});
            yield put(bitacoraActions.setBitacoraAll(respuestaArray.data.results));
            yield put(alertActions.success("Consulta realizada con éxito"));
            yield put(alertActions.clear());

    }
}

export function* ResetPassword(){
    while (true){
        const {credentialUser} = yield take (mutations.REQUEST_RESET_PASSWORD);
        let correo = credentialUser.correo;
        let status;

        const requestBody = {
            correo: correo
        }

        try{
            status = yield axios.post(ur + `/resetpassword`, qs.stringify(requestBody), { headers: {validateStatus: () => true ,'Content-Type': 'application/x-www-form-urlencoded' } });
            //localStorage.setItem("token", token.data.access_token);
            if(credentialUser.sistema===true){
                history.push('/usuarios');
            }else{
                history.push('/restaurarpassword');
            }


            console.log(status.data.message);
            if(status.data.Status === 200){
                yield put(alertActions.success(status.data.message));
            }else{
                //error in response
                yield put(alertActions.error(status.data.message));
            }
        }catch (err) {

        }
    }
}
