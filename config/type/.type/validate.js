/* eslint-disable */
// @ts-nocheck

"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/events/api/config","x-exports":["types","validate"],"x-ajv":{"coerceTypes":"array"},"type":"object","title":"Api config","additionalProperties":false,"required":["port","secretKeys","helmet","observer","puppeteerLaunchOptions","concurrency","inspectConcurrency","defaultLang","defaultTimezone","screenshotTimeout","wait","pngFastEncodingPixels","maxAnimationFrames"],"properties":{"port":{"type":"number"},"publicUrl":{"type":"string"},"privateDirectoryUrl":{"type":"string","pattern":"^https?://"},"helmet":{"type":"object","additionalProperties":false,"required":["active"],"properties":{"active":{"type":"boolean"}}},"secretKeys":{"type":"object","additionalProperties":false,"required":["capture"],"properties":{"capture":{"type":"string"},"inspect":{"type":"string"}}},"observer":{"type":"object","properties":{"active":{"type":"boolean"},"port":{"type":"number"}}},"puppeteerLaunchOptions":{"type":"object"},"concurrency":{"type":"integer"},"inspectConcurrency":{"type":"integer","minimum":1},"defaultLang":{"type":"string"},"defaultTimezone":{"type":"string"},"onlySameHost":{"type":"boolean"},"useHostHeader":{"type":"boolean"},"screenshotTimeout":{"type":"number"},"wait":{"type":"object","description":"How long a page that does not call window.triggerCapture is waited for","additionalProperties":false,"required":["networkIdleTime","quietTime","maxSettleTime"],"properties":{"networkIdleTime":{"type":"number","description":"milliseconds without any network request before the page is considered loaded"},"quietTime":{"type":"number","description":"then, milliseconds without DOM mutation, animation frame, finite animation or font loading before the capture"},"maxSettleTime":{"type":"number","description":"the longest wait for that quiet, after the network is idle"}}},"pngFastEncodingPixels":{"type":"number","description":"above this number of pixels, and for full page captures, PNG screenshots are encoded for speed rather than size"},"maxAnimationFrames":{"type":"number"},"util":{},"get":{},"has":{}}};
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
if(data.defaultLang === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "defaultLang"},message:"must have required property '"+"defaultLang"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.defaultTimezone === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "defaultTimezone"},message:"must have required property '"+"defaultTimezone"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.screenshotTimeout === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "screenshotTimeout"},message:"must have required property '"+"screenshotTimeout"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.wait === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "wait"},message:"must have required property '"+"wait"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.pngFastEncodingPixels === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "pngFastEncodingPixels"},message:"must have required property '"+"pngFastEncodingPixels"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.maxAnimationFrames === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "maxAnimationFrames"},message:"must have required property '"+"maxAnimationFrames"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
for(const key0 in data){
if(!(func2.call(schema16.properties, key0))){
const err13 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
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
const err14 = {instancePath:instancePath+"/port",schemaPath:"#/properties/port/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
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
const err15 = {instancePath:instancePath+"/publicUrl",schemaPath:"#/properties/publicUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
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
const err16 = {instancePath:instancePath+"/privateDirectoryUrl",schemaPath:"#/properties/privateDirectoryUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
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
const err17 = {instancePath:instancePath+"/privateDirectoryUrl",schemaPath:"#/properties/privateDirectoryUrl/pattern",keyword:"pattern",params:{pattern: "^https?://"},message:"must match pattern \""+"^https?://"+"\""};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
}
if(data.helmet !== undefined){
let data3 = data.helmet;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.active === undefined){
const err18 = {instancePath:instancePath+"/helmet",schemaPath:"#/properties/helmet/required",keyword:"required",params:{missingProperty: "active"},message:"must have required property '"+"active"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
for(const key1 in data3){
if(!(key1 === "active")){
const err19 = {instancePath:instancePath+"/helmet",schemaPath:"#/properties/helmet/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
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
const err20 = {instancePath:instancePath+"/helmet/active",schemaPath:"#/properties/helmet/properties/active/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
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
const err21 = {instancePath:instancePath+"/helmet",schemaPath:"#/properties/helmet/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.secretKeys !== undefined){
let data5 = data.secretKeys;
if(data5 && typeof data5 == "object" && !Array.isArray(data5)){
if(data5.capture === undefined){
const err22 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/required",keyword:"required",params:{missingProperty: "capture"},message:"must have required property '"+"capture"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
for(const key2 in data5){
if(!((key2 === "capture") || (key2 === "inspect"))){
const err23 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
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
const err24 = {instancePath:instancePath+"/secretKeys/capture",schemaPath:"#/properties/secretKeys/properties/capture/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
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
const err25 = {instancePath:instancePath+"/secretKeys/inspect",schemaPath:"#/properties/secretKeys/properties/inspect/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
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
const err26 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
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
const err27 = {instancePath:instancePath+"/observer/active",schemaPath:"#/properties/observer/properties/active/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
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
const err28 = {instancePath:instancePath+"/observer/port",schemaPath:"#/properties/observer/properties/port/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
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
const err29 = {instancePath:instancePath+"/observer",schemaPath:"#/properties/observer/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data.puppeteerLaunchOptions !== undefined){
let data11 = data.puppeteerLaunchOptions;
if(!(data11 && typeof data11 == "object" && !Array.isArray(data11))){
const err30 = {instancePath:instancePath+"/puppeteerLaunchOptions",schemaPath:"#/properties/puppeteerLaunchOptions/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
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
const err31 = {instancePath:instancePath+"/concurrency",schemaPath:"#/properties/concurrency/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
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
if(data.inspectConcurrency !== undefined){
let data13 = data.inspectConcurrency;
if(!((typeof data13 == "number") && (!(data13 % 1) && !isNaN(data13)))){
let dataType9 = typeof data13;
let coerced9 = undefined;
if(dataType9 == 'object' && Array.isArray(data13) && data13.length == 1){
data13 = data13[0];
dataType9 = typeof data13;
if((typeof data13 == "number") && (!(data13 % 1) && !isNaN(data13))){
coerced9 = data13;
}
}
if(!(coerced9 !== undefined)){
if(dataType9 === "boolean" || data13 === null
              || (dataType9 === "string" && data13 && data13 == +data13 && !(data13 % 1))){
coerced9 = +data13;
}
else {
const err32 = {instancePath:instancePath+"/inspectConcurrency",schemaPath:"#/properties/inspectConcurrency/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(coerced9 !== undefined){
data13 = coerced9;
if(data !== undefined){
data["inspectConcurrency"] = coerced9;
}
}
}
if(typeof data13 == "number"){
if(data13 < 1 || isNaN(data13)){
const err33 = {instancePath:instancePath+"/inspectConcurrency",schemaPath:"#/properties/inspectConcurrency/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
}
if(data.defaultLang !== undefined){
let data14 = data.defaultLang;
if(typeof data14 !== "string"){
let dataType10 = typeof data14;
let coerced10 = undefined;
if(dataType10 == 'object' && Array.isArray(data14) && data14.length == 1){
data14 = data14[0];
dataType10 = typeof data14;
if(typeof data14 === "string"){
coerced10 = data14;
}
}
if(!(coerced10 !== undefined)){
if(dataType10 == "number" || dataType10 == "boolean"){
coerced10 = "" + data14;
}
else if(data14 === null){
coerced10 = "";
}
else {
const err34 = {instancePath:instancePath+"/defaultLang",schemaPath:"#/properties/defaultLang/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(coerced10 !== undefined){
data14 = coerced10;
if(data !== undefined){
data["defaultLang"] = coerced10;
}
}
}
}
if(data.defaultTimezone !== undefined){
let data15 = data.defaultTimezone;
if(typeof data15 !== "string"){
let dataType11 = typeof data15;
let coerced11 = undefined;
if(dataType11 == 'object' && Array.isArray(data15) && data15.length == 1){
data15 = data15[0];
dataType11 = typeof data15;
if(typeof data15 === "string"){
coerced11 = data15;
}
}
if(!(coerced11 !== undefined)){
if(dataType11 == "number" || dataType11 == "boolean"){
coerced11 = "" + data15;
}
else if(data15 === null){
coerced11 = "";
}
else {
const err35 = {instancePath:instancePath+"/defaultTimezone",schemaPath:"#/properties/defaultTimezone/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(coerced11 !== undefined){
data15 = coerced11;
if(data !== undefined){
data["defaultTimezone"] = coerced11;
}
}
}
}
if(data.onlySameHost !== undefined){
let data16 = data.onlySameHost;
if(typeof data16 !== "boolean"){
let dataType12 = typeof data16;
let coerced12 = undefined;
if(dataType12 == 'object' && Array.isArray(data16) && data16.length == 1){
data16 = data16[0];
dataType12 = typeof data16;
if(typeof data16 === "boolean"){
coerced12 = data16;
}
}
if(!(coerced12 !== undefined)){
if(data16 === "false" || data16 === 0 || data16 === null){
coerced12 = false;
}
else if(data16 === "true" || data16 === 1){
coerced12 = true;
}
else {
const err36 = {instancePath:instancePath+"/onlySameHost",schemaPath:"#/properties/onlySameHost/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(coerced12 !== undefined){
data16 = coerced12;
if(data !== undefined){
data["onlySameHost"] = coerced12;
}
}
}
}
if(data.useHostHeader !== undefined){
let data17 = data.useHostHeader;
if(typeof data17 !== "boolean"){
let dataType13 = typeof data17;
let coerced13 = undefined;
if(dataType13 == 'object' && Array.isArray(data17) && data17.length == 1){
data17 = data17[0];
dataType13 = typeof data17;
if(typeof data17 === "boolean"){
coerced13 = data17;
}
}
if(!(coerced13 !== undefined)){
if(data17 === "false" || data17 === 0 || data17 === null){
coerced13 = false;
}
else if(data17 === "true" || data17 === 1){
coerced13 = true;
}
else {
const err37 = {instancePath:instancePath+"/useHostHeader",schemaPath:"#/properties/useHostHeader/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(coerced13 !== undefined){
data17 = coerced13;
if(data !== undefined){
data["useHostHeader"] = coerced13;
}
}
}
}
if(data.screenshotTimeout !== undefined){
let data18 = data.screenshotTimeout;
if(!(typeof data18 == "number")){
let dataType14 = typeof data18;
let coerced14 = undefined;
if(dataType14 == 'object' && Array.isArray(data18) && data18.length == 1){
data18 = data18[0];
dataType14 = typeof data18;
if(typeof data18 == "number"){
coerced14 = data18;
}
}
if(!(coerced14 !== undefined)){
if(dataType14 == "boolean" || data18 === null
              || (dataType14 == "string" && data18 && data18 == +data18)){
coerced14 = +data18;
}
else {
const err38 = {instancePath:instancePath+"/screenshotTimeout",schemaPath:"#/properties/screenshotTimeout/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(coerced14 !== undefined){
data18 = coerced14;
if(data !== undefined){
data["screenshotTimeout"] = coerced14;
}
}
}
}
if(data.wait !== undefined){
let data19 = data.wait;
if(data19 && typeof data19 == "object" && !Array.isArray(data19)){
if(data19.networkIdleTime === undefined){
const err39 = {instancePath:instancePath+"/wait",schemaPath:"#/properties/wait/required",keyword:"required",params:{missingProperty: "networkIdleTime"},message:"must have required property '"+"networkIdleTime"+"'"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data19.quietTime === undefined){
const err40 = {instancePath:instancePath+"/wait",schemaPath:"#/properties/wait/required",keyword:"required",params:{missingProperty: "quietTime"},message:"must have required property '"+"quietTime"+"'"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data19.maxSettleTime === undefined){
const err41 = {instancePath:instancePath+"/wait",schemaPath:"#/properties/wait/required",keyword:"required",params:{missingProperty: "maxSettleTime"},message:"must have required property '"+"maxSettleTime"+"'"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
for(const key3 in data19){
if(!(((key3 === "networkIdleTime") || (key3 === "quietTime")) || (key3 === "maxSettleTime"))){
const err42 = {instancePath:instancePath+"/wait",schemaPath:"#/properties/wait/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data19.networkIdleTime !== undefined){
let data20 = data19.networkIdleTime;
if(!(typeof data20 == "number")){
let dataType15 = typeof data20;
let coerced15 = undefined;
if(dataType15 == 'object' && Array.isArray(data20) && data20.length == 1){
data20 = data20[0];
dataType15 = typeof data20;
if(typeof data20 == "number"){
coerced15 = data20;
}
}
if(!(coerced15 !== undefined)){
if(dataType15 == "boolean" || data20 === null
              || (dataType15 == "string" && data20 && data20 == +data20)){
coerced15 = +data20;
}
else {
const err43 = {instancePath:instancePath+"/wait/networkIdleTime",schemaPath:"#/properties/wait/properties/networkIdleTime/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(coerced15 !== undefined){
data20 = coerced15;
if(data19 !== undefined){
data19["networkIdleTime"] = coerced15;
}
}
}
}
if(data19.quietTime !== undefined){
let data21 = data19.quietTime;
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
const err44 = {instancePath:instancePath+"/wait/quietTime",schemaPath:"#/properties/wait/properties/quietTime/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(coerced16 !== undefined){
data21 = coerced16;
if(data19 !== undefined){
data19["quietTime"] = coerced16;
}
}
}
}
if(data19.maxSettleTime !== undefined){
let data22 = data19.maxSettleTime;
if(!(typeof data22 == "number")){
let dataType17 = typeof data22;
let coerced17 = undefined;
if(dataType17 == 'object' && Array.isArray(data22) && data22.length == 1){
data22 = data22[0];
dataType17 = typeof data22;
if(typeof data22 == "number"){
coerced17 = data22;
}
}
if(!(coerced17 !== undefined)){
if(dataType17 == "boolean" || data22 === null
              || (dataType17 == "string" && data22 && data22 == +data22)){
coerced17 = +data22;
}
else {
const err45 = {instancePath:instancePath+"/wait/maxSettleTime",schemaPath:"#/properties/wait/properties/maxSettleTime/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(coerced17 !== undefined){
data22 = coerced17;
if(data19 !== undefined){
data19["maxSettleTime"] = coerced17;
}
}
}
}
}
else {
const err46 = {instancePath:instancePath+"/wait",schemaPath:"#/properties/wait/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(data.pngFastEncodingPixels !== undefined){
let data23 = data.pngFastEncodingPixels;
if(!(typeof data23 == "number")){
let dataType18 = typeof data23;
let coerced18 = undefined;
if(dataType18 == 'object' && Array.isArray(data23) && data23.length == 1){
data23 = data23[0];
dataType18 = typeof data23;
if(typeof data23 == "number"){
coerced18 = data23;
}
}
if(!(coerced18 !== undefined)){
if(dataType18 == "boolean" || data23 === null
              || (dataType18 == "string" && data23 && data23 == +data23)){
coerced18 = +data23;
}
else {
const err47 = {instancePath:instancePath+"/pngFastEncodingPixels",schemaPath:"#/properties/pngFastEncodingPixels/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(coerced18 !== undefined){
data23 = coerced18;
if(data !== undefined){
data["pngFastEncodingPixels"] = coerced18;
}
}
}
}
if(data.maxAnimationFrames !== undefined){
let data24 = data.maxAnimationFrames;
if(!(typeof data24 == "number")){
let dataType19 = typeof data24;
let coerced19 = undefined;
if(dataType19 == 'object' && Array.isArray(data24) && data24.length == 1){
data24 = data24[0];
dataType19 = typeof data24;
if(typeof data24 == "number"){
coerced19 = data24;
}
}
if(!(coerced19 !== undefined)){
if(dataType19 == "boolean" || data24 === null
              || (dataType19 == "string" && data24 && data24 == +data24)){
coerced19 = +data24;
}
else {
const err48 = {instancePath:instancePath+"/maxAnimationFrames",schemaPath:"#/properties/maxAnimationFrames/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(coerced19 !== undefined){
data24 = coerced19;
if(data !== undefined){
data["maxAnimationFrames"] = coerced19;
}
}
}
}
}
else {
const err49 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
