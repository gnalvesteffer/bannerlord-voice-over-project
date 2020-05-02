const path = require('path');
const fs = require('fs');
const readDirRecursive = require('fs-readdir-recursive');
const convert = require('xml-js');


// todo make this configurable
// const PATH_TO_BANNERLORD = 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Mount & Blade II Bannerlord';
const PATH_TO_BANNERLORD = 'V:\\SteamLibrary\\steamapps\\common\\Mount & Blade II Bannerlord';
const OUTPUT_PATH = path.join(__dirname, '../output');
const OUTPUT_FILE = path.join(OUTPUT_PATH, './voicelines.csv');
const LANGUAGE_TO_EXTRACT = "English";

const xmlFiles = readDirRecursive(PATH_TO_BANNERLORD)
    .map(name => path.join(PATH_TO_BANNERLORD, name))
    .filter(file => file.endsWith('.xml'));

const getXmlFileAsJson = (xmlFile) => {
    const fileContents = `${fs.readFileSync(xmlFile)}`;
    try {
        return JSON.parse(convert.xml2json(fileContents, {compact: true}));
    } catch {
        return {};
    }
};

const seeIfJSONIsValid = (json) => {
    if(!json || !json.base || !json.base.tags || !json.base.tags.tag){
        return false;
    }
    const hasLanguageInTags = json.base.tags.tag._attributes.language === LANGUAGE_TO_EXTRACT;
    const hasStrings = json.base.strings && json.base.strings.string;
    return hasLanguageInTags && hasStrings;
};

const getVoiceLinesFromJSON = (json) => {
    if(!Array.isArray(json.base.strings.string)){
        return [{
            ...json.base.strings.string._attributes,
        }];
    }
    return json.base.strings.string.map(string => {
        return {
            ...string._attributes,
        };
    })
};

const makeCSVFromVoicelines = (voicelines) => {
    const header = `id, text\n`;
    const data = voicelines.map(line => `${line.id},${line.text}`).join('\n');
    const csv = `${header}${data}`
    if(!fs.existsSync(OUTPUT_PATH)){
        fs.mkdirSync(OUTPUT_PATH);
    }
    fs.writeFileSync(OUTPUT_FILE, csv);
};

const main = () => {
    let voicelines = [];
    xmlFiles.forEach((file) => {
        const json = getXmlFileAsJson(file);
        if(!seeIfJSONIsValid(json)){
            return;
        }
        console.log(`Extracting strings from ${file}`);
        voicelines = [...voicelines, ...getVoiceLinesFromJSON(json)]
    });
    makeCSVFromVoicelines(voicelines);
};

try {
    main();
    console.log('done!');
}
catch(e){
    console.log(e);
}
