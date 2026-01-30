/* eslint-disable */
// @ts-nocheck

"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/events/api/config","x-exports":["types","validate"],"x-ajv":{"coerceTypes":"array"},"type":"object","title":"Api config","additionalProperties":false,"required":["port","secretKeys","helmet","observer","puppeteerLaunchOptions","concurrency","defaultLang","defaultTimezone","screenshotTimeout","maxAnimationFrames"],"properties":{"port":{"type":"number"},"publicUrl":{"type":"string"},"privateDirectoryUrl":{"type":"string","pattern":"^https?://"},"helmet":{"type":"object","additionalProperties":false,"required":["active"],"properties":{"active":{"type":"boolean"}}},"secretKeys":{"type":"object","additionalProperties":false,"required":["capture"],"properties":{"capture":{"type":"string"}}},"observer":{"type":"object","properties":{"active":{"type":"boolean"},"port":{"type":"number"}}},"puppeteerLaunchOptions":{"type":"object"},"concurrency":{"type":"integer"},"defaultLang":{"type":"string"},"defaultTimezone":{"type":"string"},"onlySameHost":{"type":"boolean"},"useHostHeader":{"type":"boolean"},"screenshotTimeout":{"type":"number"},"maxAnimationFrames":{"type":"number"},"util":{},"get":{},"has":{}}};
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
const err12 = {instancePath:instancePath+"/publicUrl",schemaPath:"#/properties/publicUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err13 = {instancePath:instancePath+"/privateDirectoryUrl",schemaPath:"#/properties/privateDirectoryUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
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
const err14 = {instancePath:instancePath+"/privateDirectoryUrl",schemaPath:"#/properties/privateDirectoryUrl/pattern",keyword:"pattern",params:{pattern: "^https?://"},message:"must match pattern \""+"^https?://"+"\""};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
}
if(data.helmet !== undefined){
let data3 = data.helmet;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.active === undefined){
const err15 = {instancePath:instancePath+"/helmet",schemaPath:"#/properties/helmet/required",keyword:"required",params:{missingProperty: "active"},message:"must have required property '"+"active"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
for(const key1 in data3){
if(!(key1 === "active")){
const err16 = {instancePath:instancePath+"/helmet",schemaPath:"#/properties/helmet/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
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
const err17 = {instancePath:instancePath+"/helmet/active",schemaPath:"#/properties/helmet/properties/active/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
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
const err18 = {instancePath:instancePath+"/helmet",schemaPath:"#/properties/helmet/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.secretKeys !== undefined){
let data5 = data.secretKeys;
if(data5 && typeof data5 == "object" && !Array.isArray(data5)){
if(data5.capture === undefined){
const err19 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/required",keyword:"required",params:{missingProperty: "capture"},message:"must have required property '"+"capture"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
for(const key2 in data5){
if(!(key2 === "capture")){
const err20 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
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
const err21 = {instancePath:instancePath+"/secretKeys/capture",schemaPath:"#/properties/secretKeys/properties/capture/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
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
}
else {
const err22 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.observer !== undefined){
let data7 = data.observer;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.active !== undefined){
let data8 = data7.active;
if(typeof data8 !== "boolean"){
let dataType5 = typeof data8;
let coerced5 = undefined;
if(dataType5 == 'object' && Array.isArray(data8) && data8.length == 1){
data8 = data8[0];
dataType5 = typeof data8;
if(typeof data8 === "boolean"){
coerced5 = data8;
}
}
if(!(coerced5 !== undefined)){
if(data8 === "false" || data8 === 0 || data8 === null){
coerced5 = false;
}
else if(data8 === "true" || data8 === 1){
coerced5 = true;
}
else {
const err23 = {instancePath:instancePath+"/observer/active",schemaPath:"#/properties/observer/properties/active/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(coerced5 !== undefined){
data8 = coerced5;
if(data7 !== undefined){
data7["active"] = coerced5;
}
}
}
}
if(data7.port !== undefined){
let data9 = data7.port;
if(!(typeof data9 == "number")){
let dataType6 = typeof data9;
let coerced6 = undefined;
if(dataType6 == 'object' && Array.isArray(data9) && data9.length == 1){
data9 = data9[0];
dataType6 = typeof data9;
if(typeof data9 == "number"){
coerced6 = data9;
}
}
if(!(coerced6 !== undefined)){
if(dataType6 == "boolean" || data9 === null
              || (dataType6 == "string" && data9 && data9 == +data9)){
coerced6 = +data9;
}
else {
const err24 = {instancePath:instancePath+"/observer/port",schemaPath:"#/properties/observer/properties/port/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(coerced6 !== undefined){
data9 = coerced6;
if(data7 !== undefined){
data7["port"] = coerced6;
}
}
}
}
}
else {
const err25 = {instancePath:instancePath+"/observer",schemaPath:"#/properties/observer/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.puppeteerLaunchOptions !== undefined){
let data10 = data.puppeteerLaunchOptions;
if(!(data10 && typeof data10 == "object" && !Array.isArray(data10))){
const err26 = {instancePath:instancePath+"/puppeteerLaunchOptions",schemaPath:"#/properties/puppeteerLaunchOptions/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.concurrency !== undefined){
let data11 = data.concurrency;
if(!((typeof data11 == "number") && (!(data11 % 1) && !isNaN(data11)))){
let dataType7 = typeof data11;
let coerced7 = undefined;
if(dataType7 == 'object' && Array.isArray(data11) && data11.length == 1){
data11 = data11[0];
dataType7 = typeof data11;
if((typeof data11 == "number") && (!(data11 % 1) && !isNaN(data11))){
coerced7 = data11;
}
}
if(!(coerced7 !== undefined)){
if(dataType7 === "boolean" || data11 === null
              || (dataType7 === "string" && data11 && data11 == +data11 && !(data11 % 1))){
coerced7 = +data11;
}
else {
const err27 = {instancePath:instancePath+"/concurrency",schemaPath:"#/properties/concurrency/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(coerced7 !== undefined){
data11 = coerced7;
if(data !== undefined){
data["concurrency"] = coerced7;
}
}
}
}
if(data.defaultLang !== undefined){
let data12 = data.defaultLang;
if(typeof data12 !== "string"){
let dataType8 = typeof data12;
let coerced8 = undefined;
if(dataType8 == 'object' && Array.isArray(data12) && data12.length == 1){
data12 = data12[0];
dataType8 = typeof data12;
if(typeof data12 === "string"){
coerced8 = data12;
}
}
if(!(coerced8 !== undefined)){
if(dataType8 == "number" || dataType8 == "boolean"){
coerced8 = "" + data12;
}
else if(data12 === null){
coerced8 = "";
}
else {
const err28 = {instancePath:instancePath+"/defaultLang",schemaPath:"#/properties/defaultLang/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(coerced8 !== undefined){
data12 = coerced8;
if(data !== undefined){
data["defaultLang"] = coerced8;
}
}
}
}
if(data.defaultTimezone !== undefined){
let data13 = data.defaultTimezone;
if(typeof data13 !== "string"){
let dataType9 = typeof data13;
let coerced9 = undefined;
if(dataType9 == 'object' && Array.isArray(data13) && data13.length == 1){
data13 = data13[0];
dataType9 = typeof data13;
if(typeof data13 === "string"){
coerced9 = data13;
}
}
if(!(coerced9 !== undefined)){
if(dataType9 == "number" || dataType9 == "boolean"){
coerced9 = "" + data13;
}
else if(data13 === null){
coerced9 = "";
}
else {
const err29 = {instancePath:instancePath+"/defaultTimezone",schemaPath:"#/properties/defaultTimezone/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(coerced9 !== undefined){
data13 = coerced9;
if(data !== undefined){
data["defaultTimezone"] = coerced9;
}
}
}
}
if(data.onlySameHost !== undefined){
let data14 = data.onlySameHost;
if(typeof data14 !== "boolean"){
let dataType10 = typeof data14;
let coerced10 = undefined;
if(dataType10 == 'object' && Array.isArray(data14) && data14.length == 1){
data14 = data14[0];
dataType10 = typeof data14;
if(typeof data14 === "boolean"){
coerced10 = data14;
}
}
if(!(coerced10 !== undefined)){
if(data14 === "false" || data14 === 0 || data14 === null){
coerced10 = false;
}
else if(data14 === "true" || data14 === 1){
coerced10 = true;
}
else {
const err30 = {instancePath:instancePath+"/onlySameHost",schemaPath:"#/properties/onlySameHost/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(coerced10 !== undefined){
data14 = coerced10;
if(data !== undefined){
data["onlySameHost"] = coerced10;
}
}
}
}
if(data.useHostHeader !== undefined){
let data15 = data.useHostHeader;
if(typeof data15 !== "boolean"){
let dataType11 = typeof data15;
let coerced11 = undefined;
if(dataType11 == 'object' && Array.isArray(data15) && data15.length == 1){
data15 = data15[0];
dataType11 = typeof data15;
if(typeof data15 === "boolean"){
coerced11 = data15;
}
}
if(!(coerced11 !== undefined)){
if(data15 === "false" || data15 === 0 || data15 === null){
coerced11 = false;
}
else if(data15 === "true" || data15 === 1){
coerced11 = true;
}
else {
const err31 = {instancePath:instancePath+"/useHostHeader",schemaPath:"#/properties/useHostHeader/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(coerced11 !== undefined){
data15 = coerced11;
if(data !== undefined){
data["useHostHeader"] = coerced11;
}
}
}
}
if(data.screenshotTimeout !== undefined){
let data16 = data.screenshotTimeout;
if(!(typeof data16 == "number")){
let dataType12 = typeof data16;
let coerced12 = undefined;
if(dataType12 == 'object' && Array.isArray(data16) && data16.length == 1){
data16 = data16[0];
dataType12 = typeof data16;
if(typeof data16 == "number"){
coerced12 = data16;
}
}
if(!(coerced12 !== undefined)){
if(dataType12 == "boolean" || data16 === null
              || (dataType12 == "string" && data16 && data16 == +data16)){
coerced12 = +data16;
}
else {
const err32 = {instancePath:instancePath+"/screenshotTimeout",schemaPath:"#/properties/screenshotTimeout/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(coerced12 !== undefined){
data16 = coerced12;
if(data !== undefined){
data["screenshotTimeout"] = coerced12;
}
}
}
}
if(data.maxAnimationFrames !== undefined){
let data17 = data.maxAnimationFrames;
if(!(typeof data17 == "number")){
let dataType13 = typeof data17;
let coerced13 = undefined;
if(dataType13 == 'object' && Array.isArray(data17) && data17.length == 1){
data17 = data17[0];
dataType13 = typeof data17;
if(typeof data17 == "number"){
coerced13 = data17;
}
}
if(!(coerced13 !== undefined)){
if(dataType13 == "boolean" || data17 === null
              || (dataType13 == "string" && data17 && data17 == +data17)){
coerced13 = +data17;
}
else {
const err33 = {instancePath:instancePath+"/maxAnimationFrames",schemaPath:"#/properties/maxAnimationFrames/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(coerced13 !== undefined){
data17 = coerced13;
if(data !== undefined){
data["maxAnimationFrames"] = coerced13;
}
}
}
}
}
else {
const err34 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
