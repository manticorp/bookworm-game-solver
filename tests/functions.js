function loopOverEveryElement( string ){
    for(var i = 0; i < words.length; i++){
        if(words[i].substr(0,string.length) === string) return true;
    }
    return false;
}

function loopOverSegment( string ){
    var start = firstFirstLetters[string[0]];
    var end = lastFirstLetter[string[0]];
    for(var j = start; j < end; j++){
        if(words[j].substr(0,string.length) === string) return true;
    }
    return false;
}