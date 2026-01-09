/* eslint-disable */
// @ts-nocheck

"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/events/api/config","x-exports":["types","validate"],"x-ajv":{"coerceTypes":"array"},"type":"object","title":"Api config","additionalProperties":false,"required":["privateDirectoryUrl","port","secretKeys","observer","puppeteerLaunchOptions","concurrency","defaultLang","defaultTimezone","screenshotTimeout","maxAnimationFrames"],"properties":{"port":{"type":"number"},"privateDirectoryUrl":{"type":"string","pattern":"^https?://"},"secretKeys":{"type":"object","additionalProperties":false,"required":["capture"],"properties":{"capture":{"type":"string"}}},"observer":{"type":"object","properties":{"active":{"type":"boolean"},"port":{"type":"number"}}},"puppeteerLaunchOptions":{"type":"object"},"concurrency":{"type":"integer"},"defaultLang":{"type":"string"},"defaultTimezone":{"type":"string"},"onlySameHost":{"type":"boolean"},"screenshotTimeout":{"type":"number"},"maxAnimationFrames":{"type":"number"},"util":{},"get":{},"has":{}}};
const func2 = Object.prototype.hasOwnProperty;
const pattern0 = new RegExp("^https?://", "u");

function validate14(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="https://github.com/data-fair/events/api/config" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.privateDirectoryUrl === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "privateDirectoryUrl"},message:"must have required property '"+"privateDirectoryUrl"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.port === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "port"},message:"must have required property '"+"port"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.secretKeys === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "secretKeys"},message:"must have required property '"+"secretKeys"+"'"};
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
if(data.defaultLang === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "defaultLang"},message:"must have required property '"+"defaultLang"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.defaultTimezone === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "defaultTimezone"},message:"must have required property '"+"defaultTimezone"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.screenshotTimeout === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "screenshotTimeout"},message:"must have required property '"+"screenshotTimeout"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.maxAnimationFrames === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "maxAnimationFrames"},message:"must have required property '"+"maxAnimationFrames"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func2.call(schema16.properties, key0))){
const err10 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
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
const err11 = {instancePath:instancePath+"/port",schemaPath:"#/properties/port/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
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
if(data.privateDirectoryUrl !== undefined){
let data1 = data.privateDirectoryUrl;
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
const err12 = {instancePath:instancePath+"/privateDirectoryUrl",schemaPath:"#/properties/privateDirectoryUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(coerced1 !== undefined){
data1 = coerced1;
if(data !== undefined){
data["privateDirectoryUrl"] = coerced1;
}
}
}
if(typeof data1 === "string"){
if(!pattern0.test(data1)){
const err13 = {instancePath:instancePath+"/privateDirectoryUrl",schemaPath:"#/properties/privateDirectoryUrl/pattern",keyword:"pattern",params:{pattern: "^https?://"},message:"must match pattern \""+"^https?://"+"\""};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
}
if(data.secretKeys !== undefined){
let data2 = data.secretKeys;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.capture === undefined){
const err14 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/required",keyword:"required",params:{missingProperty: "capture"},message:"must have required property '"+"capture"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
for(const key1 in data2){
if(!(key1 === "capture")){
const err15 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data2.capture !== undefined){
let data3 = data2.capture;
if(typeof data3 !== "string"){
let dataType2 = typeof data3;
let coerced2 = undefined;
if(dataType2 == 'object' && Array.isArray(data3) && data3.length == 1){
data3 = data3[0];
dataType2 = typeof data3;
if(typeof data3 === "string"){
coerced2 = data3;
}
}
if(!(coerced2 !== undefined)){
if(dataType2 == "number" || dataType2 == "boolean"){
coerced2 = "" + data3;
}
else if(data3 === null){
coerced2 = "";
}
else {
const err16 = {instancePath:instancePath+"/secretKeys/capture",schemaPath:"#/properties/secretKeys/properties/capture/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
data3 = coerced2;
if(data2 !== undefined){
data2["capture"] = coerced2;
}
}
}
}
}
else {
const err17 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.observer !== undefined){
let data4 = data.observer;
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if(data4.active !== undefined){
let data5 = data4.active;
if(typeof data5 !== "boolean"){
let dataType3 = typeof data5;
let coerced3 = undefined;
if(dataType3 == 'object' && Array.isArray(data5) && data5.length == 1){
data5 = data5[0];
dataType3 = typeof data5;
if(typeof data5 === "boolean"){
coerced3 = data5;
}
}
if(!(coerced3 !== undefined)){
if(data5 === "false" || data5 === 0 || data5 === null){
coerced3 = false;
}
else if(data5 === "true" || data5 === 1){
coerced3 = true;
}
else {
const err18 = {instancePath:instancePath+"/observer/active",schemaPath:"#/properties/observer/properties/active/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(coerced3 !== undefined){
data5 = coerced3;
if(data4 !== undefined){
data4["active"] = coerced3;
}
}
}
}
if(data4.port !== undefined){
let data6 = data4.port;
if(!(typeof data6 == "number")){
let dataType4 = typeof data6;
let coerced4 = undefined;
if(dataType4 == 'object' && Array.isArray(data6) && data6.length == 1){
data6 = data6[0];
dataType4 = typeof data6;
if(typeof data6 == "number"){
coerced4 = data6;
}
}
if(!(coerced4 !== undefined)){
if(dataType4 == "boolean" || data6 === null
              || (dataType4 == "string" && data6 && data6 == +data6)){
coerced4 = +data6;
}
else {
const err19 = {instancePath:instancePath+"/observer/port",schemaPath:"#/properties/observer/properties/port/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(coerced4 !== undefined){
data6 = coerced4;
if(data4 !== undefined){
data4["port"] = coerced4;
}
}
}
}
}
else {
const err20 = {instancePath:instancePath+"/observer",schemaPath:"#/properties/observer/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.puppeteerLaunchOptions !== undefined){
let data7 = data.puppeteerLaunchOptions;
if(!(data7 && typeof data7 == "object" && !Array.isArray(data7))){
const err21 = {instancePath:instancePath+"/puppeteerLaunchOptions",schemaPath:"#/properties/puppeteerLaunchOptions/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.concurrency !== undefined){
let data8 = data.concurrency;
if(!((typeof data8 == "number") && (!(data8 % 1) && !isNaN(data8)))){
let dataType5 = typeof data8;
let coerced5 = undefined;
if(dataType5 == 'object' && Array.isArray(data8) && data8.length == 1){
data8 = data8[0];
dataType5 = typeof data8;
if((typeof data8 == "number") && (!(data8 % 1) && !isNaN(data8))){
coerced5 = data8;
}
}
if(!(coerced5 !== undefined)){
if(dataType5 === "boolean" || data8 === null
              || (dataType5 === "string" && data8 && data8 == +data8 && !(data8 % 1))){
coerced5 = +data8;
}
else {
const err22 = {instancePath:instancePath+"/concurrency",schemaPath:"#/properties/concurrency/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(coerced5 !== undefined){
data8 = coerced5;
if(data !== undefined){
data["concurrency"] = coerced5;
}
}
}
}
if(data.defaultLang !== undefined){
let data9 = data.defaultLang;
if(typeof data9 !== "string"){
let dataType6 = typeof data9;
let coerced6 = undefined;
if(dataType6 == 'object' && Array.isArray(data9) && data9.length == 1){
data9 = data9[0];
dataType6 = typeof data9;
if(typeof data9 === "string"){
coerced6 = data9;
}
}
if(!(coerced6 !== undefined)){
if(dataType6 == "number" || dataType6 == "boolean"){
coerced6 = "" + data9;
}
else if(data9 === null){
coerced6 = "";
}
else {
const err23 = {instancePath:instancePath+"/defaultLang",schemaPath:"#/properties/defaultLang/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(coerced6 !== undefined){
data9 = coerced6;
if(data !== undefined){
data["defaultLang"] = coerced6;
}
}
}
}
if(data.defaultTimezone !== undefined){
let data10 = data.defaultTimezone;
if(typeof data10 !== "string"){
let dataType7 = typeof data10;
let coerced7 = undefined;
if(dataType7 == 'object' && Array.isArray(data10) && data10.length == 1){
data10 = data10[0];
dataType7 = typeof data10;
if(typeof data10 === "string"){
coerced7 = data10;
}
}
if(!(coerced7 !== undefined)){
if(dataType7 == "number" || dataType7 == "boolean"){
coerced7 = "" + data10;
}
else if(data10 === null){
coerced7 = "";
}
else {
const err24 = {instancePath:instancePath+"/defaultTimezone",schemaPath:"#/properties/defaultTimezone/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(coerced7 !== undefined){
data10 = coerced7;
if(data !== undefined){
data["defaultTimezone"] = coerced7;
}
}
}
}
if(data.onlySameHost !== undefined){
let data11 = data.onlySameHost;
if(typeof data11 !== "boolean"){
let dataType8 = typeof data11;
let coerced8 = undefined;
if(dataType8 == 'object' && Array.isArray(data11) && data11.length == 1){
data11 = data11[0];
dataType8 = typeof data11;
if(typeof data11 === "boolean"){
coerced8 = data11;
}
}
if(!(coerced8 !== undefined)){
if(data11 === "false" || data11 === 0 || data11 === null){
coerced8 = false;
}
else if(data11 === "true" || data11 === 1){
coerced8 = true;
}
else {
const err25 = {instancePath:instancePath+"/onlySameHost",schemaPath:"#/properties/onlySameHost/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(coerced8 !== undefined){
data11 = coerced8;
if(data !== undefined){
data["onlySameHost"] = coerced8;
}
}
}
}
if(data.screenshotTimeout !== undefined){
let data12 = data.screenshotTimeout;
if(!(typeof data12 == "number")){
let dataType9 = typeof data12;
let coerced9 = undefined;
if(dataType9 == 'object' && Array.isArray(data12) && data12.length == 1){
data12 = data12[0];
dataType9 = typeof data12;
if(typeof data12 == "number"){
coerced9 = data12;
}
}
if(!(coerced9 !== undefined)){
if(dataType9 == "boolean" || data12 === null
              || (dataType9 == "string" && data12 && data12 == +data12)){
coerced9 = +data12;
}
else {
const err26 = {instancePath:instancePath+"/screenshotTimeout",schemaPath:"#/properties/screenshotTimeout/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(coerced9 !== undefined){
data12 = coerced9;
if(data !== undefined){
data["screenshotTimeout"] = coerced9;
}
}
}
}
if(data.maxAnimationFrames !== undefined){
let data13 = data.maxAnimationFrames;
if(!(typeof data13 == "number")){
let dataType10 = typeof data13;
let coerced10 = undefined;
if(dataType10 == 'object' && Array.isArray(data13) && data13.length == 1){
data13 = data13[0];
dataType10 = typeof data13;
if(typeof data13 == "number"){
coerced10 = data13;
}
}
if(!(coerced10 !== undefined)){
if(dataType10 == "boolean" || data13 === null
              || (dataType10 == "string" && data13 && data13 == +data13)){
coerced10 = +data13;
}
else {
const err27 = {instancePath:instancePath+"/maxAnimationFrames",schemaPath:"#/properties/maxAnimationFrames/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(coerced10 !== undefined){
data13 = coerced10;
if(data !== undefined){
data["maxAnimationFrames"] = coerced10;
}
}
}
}
}
else {
const err28 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
