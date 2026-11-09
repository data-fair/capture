/* eslint-disable */
// @ts-nocheck

"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/events/api/config","x-exports":["types","validate"],"x-ajv":{"coerceTypes":"array"},"type":"object","title":"Api config","additionalProperties":false,"required":["port","secretKeys","helmet","observer","puppeteerLaunchOptions","concurrency","inspectConcurrency","queue","defaultLang","defaultTimezone","screenshotTimeout","wait","pngFastEncodingPixels","maxAnimationFrames","gifThreads"],"properties":{"port":{"type":"number"},"publicUrl":{"type":"string"},"privateDirectoryUrl":{"type":"string","pattern":"^https?://"},"helmet":{"type":"object","additionalProperties":false,"required":["active"],"properties":{"active":{"type":"boolean"}}},"secretKeys":{"type":"object","additionalProperties":false,"required":["capture"],"properties":{"capture":{"type":"string"},"inspect":{"type":"string"}}},"observer":{"type":"object","properties":{"active":{"type":"boolean"},"port":{"type":"number"}}},"puppeteerLaunchOptions":{"type":"object"},"concurrency":{"type":"integer"},"queue":{"type":"object","description":"Captures waiting for a browser context","additionalProperties":false,"required":["maxWaiting","maxWaitTime"],"properties":{"maxWaiting":{"type":"integer","minimum":0,"description":"beyond this number of waiting captures, new ones are answered by a 503"},"maxWaitTime":{"type":"number","description":"milliseconds of waiting for a context before a 503"}}},"inspectConcurrency":{"type":"integer","minimum":1},"defaultLang":{"type":"string"},"defaultTimezone":{"type":"string"},"onlySameHost":{"type":"boolean"},"useHostHeader":{"type":"boolean"},"screenshotTimeout":{"type":"number"},"wait":{"type":"object","description":"How long a page that does not call window.triggerCapture is waited for","additionalProperties":false,"required":["networkIdleTime","quietTime","maxSettleTime"],"properties":{"networkIdleTime":{"type":"number","description":"milliseconds without any network request before the page is considered loaded"},"quietTime":{"type":"number","description":"then, milliseconds without DOM mutation, animation frame, finite animation or font loading before the capture"},"maxSettleTime":{"type":"number","description":"the longest wait for that quiet, after the network is idle"}}},"pngFastEncodingPixels":{"type":"number","description":"above this number of pixels, and for full page captures, PNG screenshots are encoded for speed rather than size"},"maxAnimationFrames":{"type":"number"},"gifThreads":{"type":"integer","minimum":1,"description":"worker threads encoding the animated captures, also the max number of gifs encoded at the same time"},"util":{},"get":{},"has":{}}};
const func2 = Object.prototype.hasOwnProperty;
const pattern0 = new RegExp("^https?://", "u");

function validate14(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="https://github.com/data-fair/events/api/config" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.port === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "port"},message:"must have required property '"+"port"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.secretKeys === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "secretKeys"},message:"must have required property '"+"secretKeys"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.helmet === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "helmet"},message:"must have required property '"+"helmet"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.observer === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "observer"},message:"must have required property '"+"observer"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.puppeteerLaunchOptions === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "puppeteerLaunchOptions"},message:"must have required property '"+"puppeteerLaunchOptions"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.concurrency === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "concurrency"},message:"must have required property '"+"concurrency"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.inspectConcurrency === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "inspectConcurrency"},message:"must have required property '"+"inspectConcurrency"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.queue === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "queue"},message:"must have required property '"+"queue"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.defaultLang === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "defaultLang"},message:"must have required property '"+"defaultLang"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.defaultTimezone === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "defaultTimezone"},message:"must have required property '"+"defaultTimezone"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.screenshotTimeout === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "screenshotTimeout"},message:"must have required property '"+"screenshotTimeout"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.wait === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "wait"},message:"must have required property '"+"wait"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.pngFastEncodingPixels === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "pngFastEncodingPixels"},message:"must have required property '"+"pngFastEncodingPixels"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.maxAnimationFrames === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "maxAnimationFrames"},message:"must have required property '"+"maxAnimationFrames"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.gifThreads === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "gifThreads"},message:"must have required property '"+"gifThreads"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
for(const key0 in data){
if(!(func2.call(schema16.properties, key0))){
const err15 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.port !== undefined){
let data0 = data.port;
if(!(typeof data0 == "number")){
let dataType0 = typeof data0;
let coerced0 = undefined;
if(dataType0 == 'object' && Array.isArray(data0) && data0.length == 1){
data0 = data0[0];
dataType0 = typeof data0;
if(typeof data0 == "number"){
coerced0 = data0;
}
}
if(!(coerced0 !== undefined)){
if(dataType0 == "boolean" || data0 === null
              || (dataType0 == "string" && data0 && data0 == +data0)){
coerced0 = +data0;
}
else {
const err16 = {instancePath:instancePath+"/port",schemaPath:"#/properties/port/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(coerced0 !== undefined){
data0 = coerced0;
if(data !== undefined){
data["port"] = coerced0;
}
}
}
}
if(data.publicUrl !== undefined){
let data1 = data.publicUrl;
if(typeof data1 !== "string"){
let dataType1 = typeof data1;
let coerced1 = undefined;
if(dataType1 == 'object' && Array.isArray(data1) && data1.length == 1){
data1 = data1[0];
dataType1 = typeof data1;
if(typeof data1 === "string"){
coerced1 = data1;
}
}
if(!(coerced1 !== undefined)){
if(dataType1 == "number" || dataType1 == "boolean"){
coerced1 = "" + data1;
}
else if(data1 === null){
coerced1 = "";
}
else {
const err17 = {instancePath:instancePath+"/publicUrl",schemaPath:"#/properties/publicUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(coerced1 !== undefined){
data1 = coerced1;
if(data !== undefined){
data["publicUrl"] = coerced1;
}
}
}
}
if(data.privateDirectoryUrl !== undefined){
let data2 = data.privateDirectoryUrl;
if(typeof data2 !== "string"){
let dataType2 = typeof data2;
let coerced2 = undefined;
if(dataType2 == 'object' && Array.isArray(data2) && data2.length == 1){
data2 = data2[0];
dataType2 = typeof data2;
if(typeof data2 === "string"){
coerced2 = data2;
}
}
if(!(coerced2 !== undefined)){
if(dataType2 == "number" || dataType2 == "boolean"){
coerced2 = "" + data2;
}
else if(data2 === null){
coerced2 = "";
}
else {
const err18 = {instancePath:instancePath+"/privateDirectoryUrl",schemaPath:"#/properties/privateDirectoryUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(coerced2 !== undefined){
data2 = coerced2;
if(data !== undefined){
data["privateDirectoryUrl"] = coerced2;
}
}
}
if(typeof data2 === "string"){
if(!pattern0.test(data2)){
const err19 = {instancePath:instancePath+"/privateDirectoryUrl",schemaPath:"#/properties/privateDirectoryUrl/pattern",keyword:"pattern",params:{pattern: "^https?://"},message:"must match pattern \""+"^https?://"+"\""};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
}
if(data.helmet !== undefined){
let data3 = data.helmet;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.active === undefined){
const err20 = {instancePath:instancePath+"/helmet",schemaPath:"#/properties/helmet/required",keyword:"required",params:{missingProperty: "active"},message:"must have required property '"+"active"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
for(const key1 in data3){
if(!(key1 === "active")){
const err21 = {instancePath:instancePath+"/helmet",schemaPath:"#/properties/helmet/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data3.active !== undefined){
let data4 = data3.active;
if(typeof data4 !== "boolean"){
let dataType3 = typeof data4;
let coerced3 = undefined;
if(dataType3 == 'object' && Array.isArray(data4) && data4.length == 1){
data4 = data4[0];
dataType3 = typeof data4;
if(typeof data4 === "boolean"){
coerced3 = data4;
}
}
if(!(coerced3 !== undefined)){
if(data4 === "false" || data4 === 0 || data4 === null){
coerced3 = false;
}
else if(data4 === "true" || data4 === 1){
coerced3 = true;
}
else {
const err22 = {instancePath:instancePath+"/helmet/active",schemaPath:"#/properties/helmet/properties/active/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(coerced3 !== undefined){
data4 = coerced3;
if(data3 !== undefined){
data3["active"] = coerced3;
}
}
}
}
}
else {
const err23 = {instancePath:instancePath+"/helmet",schemaPath:"#/properties/helmet/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.secretKeys !== undefined){
let data5 = data.secretKeys;
if(data5 && typeof data5 == "object" && !Array.isArray(data5)){
if(data5.capture === undefined){
const err24 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/required",keyword:"required",params:{missingProperty: "capture"},message:"must have required property '"+"capture"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
for(const key2 in data5){
if(!((key2 === "capture") || (key2 === "inspect"))){
const err25 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data5.capture !== undefined){
let data6 = data5.capture;
if(typeof data6 !== "string"){
let dataType4 = typeof data6;
let coerced4 = undefined;
if(dataType4 == 'object' && Array.isArray(data6) && data6.length == 1){
data6 = data6[0];
dataType4 = typeof data6;
if(typeof data6 === "string"){
coerced4 = data6;
}
}
if(!(coerced4 !== undefined)){
if(dataType4 == "number" || dataType4 == "boolean"){
coerced4 = "" + data6;
}
else if(data6 === null){
coerced4 = "";
}
else {
const err26 = {instancePath:instancePath+"/secretKeys/capture",schemaPath:"#/properties/secretKeys/properties/capture/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(coerced4 !== undefined){
data6 = coerced4;
if(data5 !== undefined){
data5["capture"] = coerced4;
}
}
}
}
if(data5.inspect !== undefined){
let data7 = data5.inspect;
if(typeof data7 !== "string"){
let dataType5 = typeof data7;
let coerced5 = undefined;
if(dataType5 == 'object' && Array.isArray(data7) && data7.length == 1){
data7 = data7[0];
dataType5 = typeof data7;
if(typeof data7 === "string"){
coerced5 = data7;
}
}
if(!(coerced5 !== undefined)){
if(dataType5 == "number" || dataType5 == "boolean"){
coerced5 = "" + data7;
}
else if(data7 === null){
coerced5 = "";
}
else {
const err27 = {instancePath:instancePath+"/secretKeys/inspect",schemaPath:"#/properties/secretKeys/properties/inspect/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(coerced5 !== undefined){
data7 = coerced5;
if(data5 !== undefined){
data5["inspect"] = coerced5;
}
}
}
}
}
else {
const err28 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.observer !== undefined){
let data8 = data.observer;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.active !== undefined){
let data9 = data8.active;
if(typeof data9 !== "boolean"){
let dataType6 = typeof data9;
let coerced6 = undefined;
if(dataType6 == 'object' && Array.isArray(data9) && data9.length == 1){
data9 = data9[0];
dataType6 = typeof data9;
if(typeof data9 === "boolean"){
coerced6 = data9;
}
}
if(!(coerced6 !== undefined)){
if(data9 === "false" || data9 === 0 || data9 === null){
coerced6 = false;
}
else if(data9 === "true" || data9 === 1){
coerced6 = true;
}
else {
const err29 = {instancePath:instancePath+"/observer/active",schemaPath:"#/properties/observer/properties/active/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(coerced6 !== undefined){
data9 = coerced6;
if(data8 !== undefined){
data8["active"] = coerced6;
}
}
}
}
if(data8.port !== undefined){
let data10 = data8.port;
if(!(typeof data10 == "number")){
let dataType7 = typeof data10;
let coerced7 = undefined;
if(dataType7 == 'object' && Array.isArray(data10) && data10.length == 1){
data10 = data10[0];
dataType7 = typeof data10;
if(typeof data10 == "number"){
coerced7 = data10;
}
}
if(!(coerced7 !== undefined)){
if(dataType7 == "boolean" || data10 === null
              || (dataType7 == "string" && data10 && data10 == +data10)){
coerced7 = +data10;
}
else {
const err30 = {instancePath:instancePath+"/observer/port",schemaPath:"#/properties/observer/properties/port/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(coerced7 !== undefined){
data10 = coerced7;
if(data8 !== undefined){
data8["port"] = coerced7;
}
}
}
}
}
else {
const err31 = {instancePath:instancePath+"/observer",schemaPath:"#/properties/observer/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.puppeteerLaunchOptions !== undefined){
let data11 = data.puppeteerLaunchOptions;
if(!(data11 && typeof data11 == "object" && !Array.isArray(data11))){
const err32 = {instancePath:instancePath+"/puppeteerLaunchOptions",schemaPath:"#/properties/puppeteerLaunchOptions/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.concurrency !== undefined){
let data12 = data.concurrency;
if(!((typeof data12 == "number") && (!(data12 % 1) && !isNaN(data12)))){
let dataType8 = typeof data12;
let coerced8 = undefined;
if(dataType8 == 'object' && Array.isArray(data12) && data12.length == 1){
data12 = data12[0];
dataType8 = typeof data12;
if((typeof data12 == "number") && (!(data12 % 1) && !isNaN(data12))){
coerced8 = data12;
}
}
if(!(coerced8 !== undefined)){
if(dataType8 === "boolean" || data12 === null
              || (dataType8 === "string" && data12 && data12 == +data12 && !(data12 % 1))){
coerced8 = +data12;
}
else {
const err33 = {instancePath:instancePath+"/concurrency",schemaPath:"#/properties/concurrency/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(coerced8 !== undefined){
data12 = coerced8;
if(data !== undefined){
data["concurrency"] = coerced8;
}
}
}
}
if(data.queue !== undefined){
let data13 = data.queue;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.maxWaiting === undefined){
const err34 = {instancePath:instancePath+"/queue",schemaPath:"#/properties/queue/required",keyword:"required",params:{missingProperty: "maxWaiting"},message:"must have required property '"+"maxWaiting"+"'"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data13.maxWaitTime === undefined){
const err35 = {instancePath:instancePath+"/queue",schemaPath:"#/properties/queue/required",keyword:"required",params:{missingProperty: "maxWaitTime"},message:"must have required property '"+"maxWaitTime"+"'"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
for(const key3 in data13){
if(!((key3 === "maxWaiting") || (key3 === "maxWaitTime"))){
const err36 = {instancePath:instancePath+"/queue",schemaPath:"#/properties/queue/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data13.maxWaiting !== undefined){
let data14 = data13.maxWaiting;
if(!((typeof data14 == "number") && (!(data14 % 1) && !isNaN(data14)))){
let dataType9 = typeof data14;
let coerced9 = undefined;
if(dataType9 == 'object' && Array.isArray(data14) && data14.length == 1){
data14 = data14[0];
dataType9 = typeof data14;
if((typeof data14 == "number") && (!(data14 % 1) && !isNaN(data14))){
coerced9 = data14;
}
}
if(!(coerced9 !== undefined)){
if(dataType9 === "boolean" || data14 === null
              || (dataType9 === "string" && data14 && data14 == +data14 && !(data14 % 1))){
coerced9 = +data14;
}
else {
const err37 = {instancePath:instancePath+"/queue/maxWaiting",schemaPath:"#/properties/queue/properties/maxWaiting/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(coerced9 !== undefined){
data14 = coerced9;
if(data13 !== undefined){
data13["maxWaiting"] = coerced9;
}
}
}
if(typeof data14 == "number"){
if(data14 < 0 || isNaN(data14)){
const err38 = {instancePath:instancePath+"/queue/maxWaiting",schemaPath:"#/properties/queue/properties/maxWaiting/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
}
if(data13.maxWaitTime !== undefined){
let data15 = data13.maxWaitTime;
if(!(typeof data15 == "number")){
let dataType10 = typeof data15;
let coerced10 = undefined;
if(dataType10 == 'object' && Array.isArray(data15) && data15.length == 1){
data15 = data15[0];
dataType10 = typeof data15;
if(typeof data15 == "number"){
coerced10 = data15;
}
}
if(!(coerced10 !== undefined)){
if(dataType10 == "boolean" || data15 === null
              || (dataType10 == "string" && data15 && data15 == +data15)){
coerced10 = +data15;
}
else {
const err39 = {instancePath:instancePath+"/queue/maxWaitTime",schemaPath:"#/properties/queue/properties/maxWaitTime/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(coerced10 !== undefined){
data15 = coerced10;
if(data13 !== undefined){
data13["maxWaitTime"] = coerced10;
}
}
}
}
}
else {
const err40 = {instancePath:instancePath+"/queue",schemaPath:"#/properties/queue/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data.inspectConcurrency !== undefined){
let data16 = data.inspectConcurrency;
if(!((typeof data16 == "number") && (!(data16 % 1) && !isNaN(data16)))){
let dataType11 = typeof data16;
let coerced11 = undefined;
if(dataType11 == 'object' && Array.isArray(data16) && data16.length == 1){
data16 = data16[0];
dataType11 = typeof data16;
if((typeof data16 == "number") && (!(data16 % 1) && !isNaN(data16))){
coerced11 = data16;
}
}
if(!(coerced11 !== undefined)){
if(dataType11 === "boolean" || data16 === null
              || (dataType11 === "string" && data16 && data16 == +data16 && !(data16 % 1))){
coerced11 = +data16;
}
else {
const err41 = {instancePath:instancePath+"/inspectConcurrency",schemaPath:"#/properties/inspectConcurrency/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(coerced11 !== undefined){
data16 = coerced11;
if(data !== undefined){
data["inspectConcurrency"] = coerced11;
}
}
}
if(typeof data16 == "number"){
if(data16 < 1 || isNaN(data16)){
const err42 = {instancePath:instancePath+"/inspectConcurrency",schemaPath:"#/properties/inspectConcurrency/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
}
if(data.defaultLang !== undefined){
let data17 = data.defaultLang;
if(typeof data17 !== "string"){
let dataType12 = typeof data17;
let coerced12 = undefined;
if(dataType12 == 'object' && Array.isArray(data17) && data17.length == 1){
data17 = data17[0];
dataType12 = typeof data17;
if(typeof data17 === "string"){
coerced12 = data17;
}
}
if(!(coerced12 !== undefined)){
if(dataType12 == "number" || dataType12 == "boolean"){
coerced12 = "" + data17;
}
else if(data17 === null){
coerced12 = "";
}
else {
const err43 = {instancePath:instancePath+"/defaultLang",schemaPath:"#/properties/defaultLang/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(coerced12 !== undefined){
data17 = coerced12;
if(data !== undefined){
data["defaultLang"] = coerced12;
}
}
}
}
if(data.defaultTimezone !== undefined){
let data18 = data.defaultTimezone;
if(typeof data18 !== "string"){
let dataType13 = typeof data18;
let coerced13 = undefined;
if(dataType13 == 'object' && Array.isArray(data18) && data18.length == 1){
data18 = data18[0];
dataType13 = typeof data18;
if(typeof data18 === "string"){
coerced13 = data18;
}
}
if(!(coerced13 !== undefined)){
if(dataType13 == "number" || dataType13 == "boolean"){
coerced13 = "" + data18;
}
else if(data18 === null){
coerced13 = "";
}
else {
const err44 = {instancePath:instancePath+"/defaultTimezone",schemaPath:"#/properties/defaultTimezone/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(coerced13 !== undefined){
data18 = coerced13;
if(data !== undefined){
data["defaultTimezone"] = coerced13;
}
}
}
}
if(data.onlySameHost !== undefined){
let data19 = data.onlySameHost;
if(typeof data19 !== "boolean"){
let dataType14 = typeof data19;
let coerced14 = undefined;
if(dataType14 == 'object' && Array.isArray(data19) && data19.length == 1){
data19 = data19[0];
dataType14 = typeof data19;
if(typeof data19 === "boolean"){
coerced14 = data19;
}
}
if(!(coerced14 !== undefined)){
if(data19 === "false" || data19 === 0 || data19 === null){
coerced14 = false;
}
else if(data19 === "true" || data19 === 1){
coerced14 = true;
}
else {
const err45 = {instancePath:instancePath+"/onlySameHost",schemaPath:"#/properties/onlySameHost/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(coerced14 !== undefined){
data19 = coerced14;
if(data !== undefined){
data["onlySameHost"] = coerced14;
}
}
}
}
if(data.useHostHeader !== undefined){
let data20 = data.useHostHeader;
if(typeof data20 !== "boolean"){
let dataType15 = typeof data20;
let coerced15 = undefined;
if(dataType15 == 'object' && Array.isArray(data20) && data20.length == 1){
data20 = data20[0];
dataType15 = typeof data20;
if(typeof data20 === "boolean"){
coerced15 = data20;
}
}
if(!(coerced15 !== undefined)){
if(data20 === "false" || data20 === 0 || data20 === null){
coerced15 = false;
}
else if(data20 === "true" || data20 === 1){
coerced15 = true;
}
else {
const err46 = {instancePath:instancePath+"/useHostHeader",schemaPath:"#/properties/useHostHeader/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(coerced15 !== undefined){
data20 = coerced15;
if(data !== undefined){
data["useHostHeader"] = coerced15;
}
}
}
}
if(data.screenshotTimeout !== undefined){
let data21 = data.screenshotTimeout;
if(!(typeof data21 == "number")){
let dataType16 = typeof data21;
let coerced16 = undefined;
if(dataType16 == 'object' && Array.isArray(data21) && data21.length == 1){
data21 = data21[0];
dataType16 = typeof data21;
if(typeof data21 == "number"){
coerced16 = data21;
}
}
if(!(coerced16 !== undefined)){
if(dataType16 == "boolean" || data21 === null
              || (dataType16 == "string" && data21 && data21 == +data21)){
coerced16 = +data21;
}
else {
const err47 = {instancePath:instancePath+"/screenshotTimeout",schemaPath:"#/properties/screenshotTimeout/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(coerced16 !== undefined){
data21 = coerced16;
if(data !== undefined){
data["screenshotTimeout"] = coerced16;
}
}
}
}
if(data.wait !== undefined){
let data22 = data.wait;
if(data22 && typeof data22 == "object" && !Array.isArray(data22)){
if(data22.networkIdleTime === undefined){
const err48 = {instancePath:instancePath+"/wait",schemaPath:"#/properties/wait/required",keyword:"required",params:{missingProperty: "networkIdleTime"},message:"must have required property '"+"networkIdleTime"+"'"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data22.quietTime === undefined){
const err49 = {instancePath:instancePath+"/wait",schemaPath:"#/properties/wait/required",keyword:"required",params:{missingProperty: "quietTime"},message:"must have required property '"+"quietTime"+"'"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(data22.maxSettleTime === undefined){
const err50 = {instancePath:instancePath+"/wait",schemaPath:"#/properties/wait/required",keyword:"required",params:{missingProperty: "maxSettleTime"},message:"must have required property '"+"maxSettleTime"+"'"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
for(const key4 in data22){
if(!(((key4 === "networkIdleTime") || (key4 === "quietTime")) || (key4 === "maxSettleTime"))){
const err51 = {instancePath:instancePath+"/wait",schemaPath:"#/properties/wait/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(data22.networkIdleTime !== undefined){
let data23 = data22.networkIdleTime;
if(!(typeof data23 == "number")){
let dataType17 = typeof data23;
let coerced17 = undefined;
if(dataType17 == 'object' && Array.isArray(data23) && data23.length == 1){
data23 = data23[0];
dataType17 = typeof data23;
if(typeof data23 == "number"){
coerced17 = data23;
}
}
if(!(coerced17 !== undefined)){
if(dataType17 == "boolean" || data23 === null
              || (dataType17 == "string" && data23 && data23 == +data23)){
coerced17 = +data23;
}
else {
const err52 = {instancePath:instancePath+"/wait/networkIdleTime",schemaPath:"#/properties/wait/properties/networkIdleTime/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(coerced17 !== undefined){
data23 = coerced17;
if(data22 !== undefined){
data22["networkIdleTime"] = coerced17;
}
}
}
}
if(data22.quietTime !== undefined){
let data24 = data22.quietTime;
if(!(typeof data24 == "number")){
let dataType18 = typeof data24;
let coerced18 = undefined;
if(dataType18 == 'object' && Array.isArray(data24) && data24.length == 1){
data24 = data24[0];
dataType18 = typeof data24;
if(typeof data24 == "number"){
coerced18 = data24;
}
}
if(!(coerced18 !== undefined)){
if(dataType18 == "boolean" || data24 === null
              || (dataType18 == "string" && data24 && data24 == +data24)){
coerced18 = +data24;
}
else {
const err53 = {instancePath:instancePath+"/wait/quietTime",schemaPath:"#/properties/wait/properties/quietTime/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
if(coerced18 !== undefined){
data24 = coerced18;
if(data22 !== undefined){
data22["quietTime"] = coerced18;
}
}
}
}
if(data22.maxSettleTime !== undefined){
let data25 = data22.maxSettleTime;
if(!(typeof data25 == "number")){
let dataType19 = typeof data25;
let coerced19 = undefined;
if(dataType19 == 'object' && Array.isArray(data25) && data25.length == 1){
data25 = data25[0];
dataType19 = typeof data25;
if(typeof data25 == "number"){
coerced19 = data25;
}
}
if(!(coerced19 !== undefined)){
if(dataType19 == "boolean" || data25 === null
              || (dataType19 == "string" && data25 && data25 == +data25)){
coerced19 = +data25;
}
else {
const err54 = {instancePath:instancePath+"/wait/maxSettleTime",schemaPath:"#/properties/wait/properties/maxSettleTime/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(coerced19 !== undefined){
data25 = coerced19;
if(data22 !== undefined){
data22["maxSettleTime"] = coerced19;
}
}
}
}
}
else {
const err55 = {instancePath:instancePath+"/wait",schemaPath:"#/properties/wait/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
if(data.pngFastEncodingPixels !== undefined){
let data26 = data.pngFastEncodingPixels;
if(!(typeof data26 == "number")){
let dataType20 = typeof data26;
let coerced20 = undefined;
if(dataType20 == 'object' && Array.isArray(data26) && data26.length == 1){
data26 = data26[0];
dataType20 = typeof data26;
if(typeof data26 == "number"){
coerced20 = data26;
}
}
if(!(coerced20 !== undefined)){
if(dataType20 == "boolean" || data26 === null
              || (dataType20 == "string" && data26 && data26 == +data26)){
coerced20 = +data26;
}
else {
const err56 = {instancePath:instancePath+"/pngFastEncodingPixels",schemaPath:"#/properties/pngFastEncodingPixels/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
if(coerced20 !== undefined){
data26 = coerced20;
if(data !== undefined){
data["pngFastEncodingPixels"] = coerced20;
}
}
}
}
if(data.maxAnimationFrames !== undefined){
let data27 = data.maxAnimationFrames;
if(!(typeof data27 == "number")){
let dataType21 = typeof data27;
let coerced21 = undefined;
if(dataType21 == 'object' && Array.isArray(data27) && data27.length == 1){
data27 = data27[0];
dataType21 = typeof data27;
if(typeof data27 == "number"){
coerced21 = data27;
}
}
if(!(coerced21 !== undefined)){
if(dataType21 == "boolean" || data27 === null
              || (dataType21 == "string" && data27 && data27 == +data27)){
coerced21 = +data27;
}
else {
const err57 = {instancePath:instancePath+"/maxAnimationFrames",schemaPath:"#/properties/maxAnimationFrames/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
}
if(coerced21 !== undefined){
data27 = coerced21;
if(data !== undefined){
data["maxAnimationFrames"] = coerced21;
}
}
}
}
if(data.gifThreads !== undefined){
let data28 = data.gifThreads;
if(!((typeof data28 == "number") && (!(data28 % 1) && !isNaN(data28)))){
let dataType22 = typeof data28;
let coerced22 = undefined;
if(dataType22 == 'object' && Array.isArray(data28) && data28.length == 1){
data28 = data28[0];
dataType22 = typeof data28;
if((typeof data28 == "number") && (!(data28 % 1) && !isNaN(data28))){
coerced22 = data28;
}
}
if(!(coerced22 !== undefined)){
if(dataType22 === "boolean" || data28 === null
              || (dataType22 === "string" && data28 && data28 == +data28 && !(data28 % 1))){
coerced22 = +data28;
}
else {
const err58 = {instancePath:instancePath+"/gifThreads",schemaPath:"#/properties/gifThreads/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(coerced22 !== undefined){
data28 = coerced22;
if(data !== undefined){
data["gifThreads"] = coerced22;
}
}
}
if(typeof data28 == "number"){
if(data28 < 1 || isNaN(data28)){
const err59 = {instancePath:instancePath+"/gifThreads",schemaPath:"#/properties/gifThreads/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
}
}
else {
const err60 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
