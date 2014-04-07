$(function(){
    var loading = {
        event: null,
        number: 0,
        texts: [
            "Dispatching Gremlins",
            "Applying Magic Powder",
            "Buttering Unicorns",
            "Marinating API Result",
            "BBQing BiBTeX",
            "Roasting Gnome Hats"
        ],
        start: function(){
            this.stop();
            $loadingbox = $('<div class="loadingbox">').append($('<p id="loadingText"></p>')).append($('<img class="loading-gif-fancy" src="img/loading-fancy.gif" alt="loading..."/>'));
            $('#result').html('').append($loadingbox);
            var that = this;
            $('#result #loadingText').text(this.texts[0] + "...");
            this.event = setInterval(function(){
                $('#result #loadingText').text(that.randomText() + "...");
            },750);
        },
        stop: function(){
            clearInterval(this.event);
        },
        randomText: function(){
            return this.texts[Math.floor(Math.random()*this.texts.length)];
        }
    };
    
    // The dictionary lookup object
    var dict = {};
    var words = [];
    
    var variants = {
        web:    [7,8,7,8,7,8,7],
        tiny:   [1,2,1],
        small:  [2,3,2],
        med:    [3,4,3,4,3]
    }
    var $board = $('<div>').attr('id','game-board');
    
    var $cols = [];
    var $cells = [];
    var $inputs = [];
    
    var timer = new STimer();
    
    var minWordLength = 3;
    var maxWordLength = 10;
    
    var permaHighlight = false;
    var permaHighlighted = false;
    var isOn = false;
    var level = 1;
    var boardType = "web";
    
    var levelMultipliers = {
        1: 1,
        2: 2,
        3: 3, 
        4: 4,
        5: 5,
        6: 6,
        7: 7,
        8: 8,
        9: 9,
        10: 10,
        11: 11,
        12: 12,
        13: 13,
        14: 14,
        15: 15,
        16: 16,
        17: 17,
        18: 18,
        19: 19,
        20: 20
    };
    
    var specialMultipliers = {
        1: 2,
        2: 4,
        3: 7,
        4: 10,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        0: 0
    };
    
    var charScores = {
        a: 1,
        b: 4,
        c: 4,
        d: 3,
        e: 1,
        f: 5,
        g: 3,
        h: 5,
        i: 1,
        j: 8,
        k: 7,
        l: 2,
        m: 4,
        n: 2,
        o: 1,
        p: 4,
        q: 7,
        qu: 7,
        r: 2,
        s: 1,
        t: 2,
        u: 2,
        v: 5,
        w: 6,
        x: 8,
        y: 6,
        z: 10
    };
    
    var charDots = {
        a: 1,
        b: 2,
        c: 2,
        d: 1,
        e: 1,
        f: 2,
        g: 1,
        h: 1,
        i: 1,
        j: 3,
        k: 2,
        l: 1,
        m: 2,
        n: 1,
        o: 1,
        p: 2,
        q: 2,
        qu: 2,
        r: 1,
        s: 1,
        t: 1,
        u: 1,
        v: 2,
        w: 2,
        x: 1,
        y: 2,
        z: 3
    };
     
    // Do a jQuery Ajax request for the text dictionary
    $.get( "words.txt", function( txt ) {
        // Get an array of all the words
        words = txt.split( "\n" );
     
        // And add them as properties to the dictionary lookup
        // This will allow for fast lookups later
        for ( var i = 0; i < words.length; i++ ) {
            dict[ words[i] ] = true;
        }
        
        // The game would start after the dictionary was loaded
        startGame();
    });
    
    $('#controls').submit(function(){
        return false;
    });
    
    $('#go').click(function(e){
        if(checkGameBoardIsFull()){
            loading.start();
            timer.start();
            level = $('#level').val() || 1;
            saveState();
            findWords();
            timer.stop()
            displayTime();
        }
    });
    
    $('#clear').click(function(e){
        $.each($inputs, function(key, $input){
            $input.val('');
            resetInput($input);
        });
        saveState();
    });
    
    $('#saveState').click(saveState);
    $('#loadState').click(loadState);
    
    $(window).bind( 'hashchange', function(e) {
        loadState();
    });
    
    function startGame(){
        var state = $.deparam.fragment();
        variant = state.boardType || boardType;
        makeGameBoard( variant );
        loadState(); 
    }

    function saveState(){
        var grid = gridState();
        var state = {grid:grid};
        state.level = $('#level').val();
        state.boardType = boardType;
        $.bbq.pushState(state);
    }
    
    function loadState(){
        var state   = $.deparam.fragment();
        grid        = state.grid;
        
        if(typeof state.boardType !== "undefined"){
            boardType = state.boardType;
        }
        
        if(typeof state.level !== "undefined"){
            level = state.level;
        } else {
            level = 1;
        }
        
        $theInputs  = $('.game-cell-input');
        $theInputs.each(function(){ // iterate over each input
            var num = $(this).data('num');
            if(typeof grid !== "undefined" && typeof grid[num] !== "undefined" && grid[num] !== ""){
                $(this).val( grid[num].val );
                $(this).data('special', grid[num].special );
                decorateInput($(this));
            } else {
                $(this).val('');
                $(this).data('special', 0 );
                decorateInput($(this));
            }
        });
        
        $('#level').val(level);
    }

    function gridState(){
        var grid = {};
        $theInputs = $('.game-cell-input');
        $theInputs.each(function(){ // iterate over each input
            if($(this).val()){
                var num = $(this).data('num');
                var special = $(this).data('special');
                if(typeof special == "undefined" || special > 5 || special == 0){
                    special = 0;
                }
                grid[num] = {val: $(this).val(), special: special};
            }
        });
        return grid;
    }
    
    function displayTime(){
        $('#time-taken').html('').append(timer.getDisplay());
    }
    
    function makeGameBoard( variant )
    {
        if(typeof variant === "undefined") variant = "web";
        
        var $col;
        var $cell;
        var $input;
        var cellno = 1;
        
        for( var i = 0; i < variants[variant].length; i++ )
        {
            var cellClass = (i%2 == 0) ? "odd" : "even";
            $col = $('<div class="game-col">').addClass(cellClass);
            $colArray = [];
            
            for( var j = 0; j < variants[variant][i]; j++ )
            {
                $input = $('<input type="text" class="game-cell-input" data-num=' + cellno + ' data-col=' + i + ' data-row=' + j + '>');
                $input.change(inputChange);
                $input.keyup(inputKeyUp);
                
                $inputCont = $('<div class="game-cell-input-cont" data-num=' + cellno + ' data-col=' + i + ' data-row=' + j + '>').append($input);
                
                $cell = $('<div class="game-cell" data-num=' + cellno + ' data-col=' + i + ' data-row=' + j + '>').append($inputCont);
                $cell.hover(inputMouseEnter,inputMouseLeave);
                
                $inputs.push($input);
                $colArray.push($input);
                
                
                $cells.push($cell);
                $col.append($cell);
                
                cellno++;
            }
            $cols.push($colArray);
            $board.append($col);
        }
        $('#game-container').html('');
        $('#game-container').append($board);
        return $board;
    }
    
    // Handler for input's onChange event
    function inputChange(e)
    {
        resetInput($(this));
        $(this).val($(this).val().toUpperCase());
        if($(this).val().length > 1){
            if($(this).val() == "QU"){
                $(this).val("Q");
            }
            
            if($(this).val().length > 2){
                $(this).val($(this).val().slice(0,2));
            } else {
                var lastChar = $(this).val().slice(-1);
                if(isNumber(lastChar)){
                    $(this).data('special', parseInt(lastChar));
                } else {
                    $(this).data('special', 0);
                    $(this).val(lastChar);
                }
            }
        }
        decorateInput($(this));
    }
    
    // Handler for input's onKeyup event
    function inputKeyUp(e)
    {
        $(this).change();
        if(e.keyCode == 13) // Return Key
        {
            $inputs[($(this).data('num'))].focus();
        }
    }
    
    function getInputFromCoords(coords){
        return $cols[coords.col][coords.row];
    }
    
    function getCellFromCoords(coords){
        
    }
    
    function inputMouseEnter(e){
        var row = parseInt($(this).data('row'));
        var col = parseInt($(this).data('col'));
        var neighbours = findNeighbours( buildGrid(),{row:row, col:col} );
        $.each(neighbours, function(index, coords){
            $input = getInputFromCoords(coords);
            $input.addClass('highlight');
        });
    }
    
    function inputMouseLeave(e){
        var row = parseInt($(this).data('row'));
        var col = parseInt($(this).data('col'));
        var neighbours = findNeighbours( buildGrid(),{row:row, col:col} );
        $.each(neighbours, function(index, coords){
            $input = getInputFromCoords(coords);
            $input.removeClass('highlight');
        });
    }
    
    function buildGrid(){
        var grid = {};
        var i = 0;
        $.each($cols, function(key, $col){ // iterate over each input
            j = 0;
            grid[i] = {};
            $.each($col, function(key, $input){
                if($input.val() == "Q") {
                    grid[i][j] = "QU";
                } else {
                    grid[i][j] = $input.val();
                }
                j++;
            });
            i++;
        });
        return grid;
    }
    
    function resetInput( $input ){
        $input.removeClass(function(){
            return "special-1 special-2 special-3 special-4 special-5 special-6 special-7 special-8 special-9 special-0 used used-start used-end static-used static-used-start static-used-end";
        }).data('special',0);
        
        $input.parent().parent().removeClass(function(){
            return "special-1 special-2 special-3 special-4 special-5 special-6 special-7 special-8 special-9 special-0 used used-start used-end static-used static-used-start static-used-end";
        }).data('special',0);
        
        $input.parent().removeClass(function(){
            return "points-0 points-1 points-2 points-3";
        });
    }
    
    function decorateInput( $input ){
        var num = $input.data('special');
        $input.data('special', num).val($input.val().slice(0,1));
        $input.parent().parent().addClass('special-'+num);
        
        var score = charDots[$input.val().toLowerCase()];
        if(typeof score !== "undefined"){
            $input.parent().addClass('points-' + score);
        }
    }
    
    // Checks if gameboard is full
    function checkGameBoardIsFull()
    {
        var isFull = true;
        
        $.each($inputs, function(index, $el){
            isFull = !!($el.val()) && isFull;
        });
        
        return isFull;
    }
    
    // finds all words available to gameboard
    function findWords(){
        if(isOn == false){
            $result = $('#result');
            $result.html('');
            
            isOn = true;
            var words = {};
            var grid = buildGrid();
            words = traverseGrid( grid );
            isOn = false;
            
            loading.stop();
            displayResults(words);
        }
    }
    
    function displayResults(results){
        $result = $('#result');
        $result.html('');
        
        var ordered = orderResultsByScore(results);
            
        $table = $("<table>")
            .attr('id', 'results-table')
            .addClass('table')
            .addClass('table-bordered')
            .addClass('table-condensed')
            .addClass('table-striped');
        $thead = $("<thead>");
        $theadrow = $("<tr>");
        $theadrow.append($('<th>Word</th>')).append($('<th>Score</th>')).append($('<th>Controls</th>'))
        $thead.append($theadrow);
        $table.append($thead);
        
        $tbody = $('<tbody>');
        for(l = (ordered.words.length-1); l >= 0; l--){
            $trow = $('<tr>');
            $trow.data("used", ordered.useds[l]);
            $trow.hover(displayUsed, unDisplayUsed);
            
            $wordcell = $('<td>');
            $link = $("<a href='#' class='result-word'></a>");
            var word = buildColoredWord(ordered.useds[l]);
            $link.append(word);
            $link.append(" ");
            $link.data("used", ordered.useds[l]);
            $wordcell.append($link);
            $trow.append($wordcell);
            
            $scorecell = $('<td>');
            var score = $("<span>").addClass('result-score').text(ordered.scores[l]);
            $scorecell.append(score);
            $trow.append($scorecell);
            
            $ccell = $('<td class="result-controls-row">');
            $highlight = $("<button class='btn btn-xs btn-primary'>Highlight <i class='glyphicon glyphicon-pencil'></i></button>").addClass('btn').addClass('word-btn').addClass('delete-btn');
            $highlight.data("used", ordered.useds[l]);
            $highlight.click(highlightThis);
            
            $delete = $("<button class='btn btn-xs btn-danger'>Delete <i class='glyphicon glyphicon-trash'></i></button>").addClass('btn').addClass('word-btn').addClass('delete-btn');
            $delete.data("used", ordered.useds[l]);
            $delete.click(deleteThis);
            
            $ccell.append($highlight).append($delete);
            $trow.append($ccell);
            
            $tbody.append($trow);
        }
        $table.append($tbody);
        $result.append($table);
    }
    
    function buildColoredWord(used){
        $word = $('<span>').addClass('result-word-span');
        $.each(used, function(key, val){
            $input = getInputFromCoords(val);
            special = $input.data('special');
            letter = $input.val();
            if(letter == "Q") letter == "QU";
            
            special = special || 0;
            
            $letter = $('<span>').addClass('letter').addClass('special-' + special).text(letter);
            $word.append($letter);
        });
        return $word;
    }
    
    function deleteThis(e){
        var used = $(this).data('used');
        colsUsed = [];
        for(var l = 0; l < used.length; l++){
            var $input = getInputFromCoords(used[l]);
            $input.val('');
            resetInput($input);
            if(colsUsed.indexOf(used[l].col) == -1){
                colsUsed.push(used[l].col);
            }
        }
        
        if(typeof boardType === "undefined") boardType = "web";
        var colSizes = variants[boardType];
        for(var l = 0; l < colsUsed.length; l++){
            col = colsUsed[l];
            for(var row = (colSizes[col]); row > 0; row--){
                var $input = getInputFromCoords({row:row, col:col});
                if( typeof $input != "undefined" && $input.val() == ""){
                    $ninput = nextFilledInCol({row:row, col:col});
                    if($ninput !== false && typeof $ninput != "undefined"){
                        $input.val($ninput.val());
                        $input.data('special',$ninput.data('special'));
                        resetInput($ninput);
                        decorateInput($input);
                    } else {
                        break;
                    }
                }
            }
        }
        saveState();
        nextTurn();
    }
    
    function nextFilledInCol( coords ){
        var $input;
        var found = false;
        for(var r = coords.row; r >=0; r--){
            $input = getInputFromCoords({row:r, col:coords.col});
            if($input.val() != ""){
                found = true;
                break;
            }
        }
        if(found)
            return $input;
        else
            return false;
    }
    
    function nextTurn(){
        $('#result').html('');
        $('#time-taken').html('');
    }
    
    function highlightThis(e){        
        var used = $(this).data('used');
        if(permaHighlighted === used ){
            permaHighlight = false;
            permaHighlighted = false;
            for(l = 0; l < used.length; l++){
                var $input = getInputFromCoords(used[l]);
                if(l === 0){
                    $input.removeClass('static-used-start');
                } else if (l === (used.length-1)){
                    $input.removeClass('static-used-end');
                } else {
                    $input.removeClass('static-used');
                }
            }
        } else {
            permaHighlight = true;
            $('.static-used-start').each(function(){$(this).removeClass('static-used-start')});
            $('.static-used-end').each(function(){$(this).removeClass('static-used-end')});
            $('.static-used').each(function(){$(this).removeClass('static-used')});
            permaHighlighted = used;
            for(l = 0; l < used.length; l++){
                var $input = getInputFromCoords(used[l]);
                if(l === 0){
                    $input.toggleClass('static-used-start');
                } else if (l === (used.length-1)){
                    $input.toggleClass('static-used-end');
                } else {
                    $input.toggleClass('static-used');
                }
            }
        }
    }
    
    function displayUsed(e){
        var used = $(this).data('used');
        for(l = 0; l < used.length; l++){
            var $input = getInputFromCoords(used[l]);
            if(l === 0){
                $input.addClass('used-start');
            } else if (l === (used.length-1)){
                $input.addClass('used-end');
            } else {
                $input.addClass('used');
            }
        }
    }
    
    function unDisplayUsed(e){
        var used = $(this).data('used');
        $.each(used, function(key, coords){
            var $input = getInputFromCoords(coords);
            $input.removeClass('used');
            $input.removeClass('used-start');
            $input.removeClass('used-end');
        });
    }
    
    function orderResultsByScore(results){
        var scores  = [];
        var words   = [];
        var useds   = [];
        var score, word, used, pos;
        $.each(results, function(key, val){
            score = calculateScore( val.used );
            word = val.word;
            used = val.used;
            if(scores.length === 0) {
                scores.push(score);
                words.push(word);
                useds.push(used);
            } else {
                pos = findPos(scores, score);
                scores.splice(pos,0,score);
                words.splice(pos,0,word);
                useds.splice(pos,0,used);
            }
        });
        return {scores: scores, words: words, useds: useds};
    }
    
    function findPos(array, item){
        for(i = 0; i < array.length; i++){
            if(item < array[i]){
                return i;
            }
        }
        return array.length;
    }
    
    function calculateScore( used ){
        var score = 0;
        var wordvalue = 0;
        var bonus = 0;
        var letter;
        var word = "";
        $.each(used, function(key, coords){
            $input = getInputFromCoords(coords);
            letter = $input.val().toLowerCase();
            if(letter == "q") letter = "qu";
            
            special = $input.data('special');
            if(typeof special === "undefined") special = 0;
            
            wordvalue = wordvalue + charScores[letter]; 
            word  = word + letter;
            bonus = bonus + specialMultipliers[special];
        });
        score = ((levelMultipliers[level] + wordvalue) * (bonus + word.length)) * 10;
        return score;
    }
    
    function traverseGrid( grid ){
        finalResults = [];
        $.each(grid, function(col, rows){
            $.each(rows, function(row, val){
                // start new word on each cell
                row = parseInt(row);
                col = parseInt(col);
                
                // timer.check(grid[col][row]);
                
                finalResults = recursiveAddAllNext(grid, [{row:row,col:col}], {row:row,col:col}, grid[col][row], finalResults);
            });
        });
        return finalResults;
    }
    
    // result structure:
    // {
    //      used: [array of used cells],
    //      word: "the word"
    // }
    function recursiveAddAllNext(grid, used, coords, word, results){
        if(isWord(word) && word.length >= minWordLength){
            results.push({used: used.slice(), word: word}); 
        }
        var nextInputs = findNextInputs(grid, used, coords);
        if(nextInputs.length != 0 && word.length < maxWordLength) {
            $.each(nextInputs, function(key, tempCoords){
                var tempUsed = used.slice(); //copy used array
                tempUsed.push(tempCoords); // add current coords to tempUsed array
                var tempWord = word + grid[tempCoords.col][tempCoords.row]; // create a temporary word
                
                var cltw = couldLeadToWords(tempWord);
                if(cltw){
                    results = recursiveAddAllNext(grid, tempUsed, tempCoords, tempWord, results);
                }
            });
        }
        return results;
    }
    
    function findNeighbours( grid, coords ){
        var result = [];
        for(var i = -1; i <= 1; i++){
            tempcol = coords.col + i;
            if(typeof grid[tempcol] !== "undefined"){
                if( tempcol == coords.col) {
                    var start = -1;
                    var end = 1;
                } else if(tempcol%2 == 0){
                    var start = -1;
                    var end = 0;
                } else {
                    var start = 0;
                    var end = 1;
                }
                for(j = start; j <= end; j++){
                    temprow = coords.row + j;
                    if(typeof grid[tempcol][temprow] !== "undefined"){
                        result.push({col:tempcol, row: temprow});
                    }
                }
            }
        }
        return result;
    }
    
    // returns list of next inputs possible from input
    function findNextInputs( grid, used, coords ){
        neighbours = findNeighbours(grid, coords);
        var result = [];
        $.each(neighbours, function(tkey, tprop){
            isUsed = (tprop.row == coords.row && tprop.col == coords.col);
            $.each(used, function(mkey, mprop){
                if(mprop.row == tprop.row && mprop.col == tprop.col){
                    isUsed = true;
                }
            });
            if(!isUsed) result.push(tprop);
        });
        return result;
    }
    
    function numProps( obj ){
        var count = 0;
        var i;
        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                count++;
            }
        }
        return count;
    }
    
    function couldLeadToWords( str ){
        result = false;
        if(str == "") return result;
        str = str.toLowerCase();
        for(i = 0; i < words.length; i++){
            if(words[i].substr(0,str.length) == str){
                result = true;
                break;
            }
        }
        return result;
    }
    
    function leadsToWords( str ){
        results = [];
        if(str == "") return results;
        str = str.toLowerCase();
        $.each(dict, function(key, val){
            if(key.substr(0,str.length) == str){
                results.push(key);
            }
        });
        return results;
    }
    
    function isWord(word){
        return !!(dict[word.toLowerCase()]);
    }
     
    // Takes in an array of letters and finds the longest
    // possible word at the front of the letters
    function findWord( letters ) {
        // Clone the array for manipulation
        var curLetters = letters.slice( 0 ), word = "";
       
        // Make sure the word is at least 3 letters long
        while ( curLetters.length > 2 ) {
            // Get a word out of the existing letters
            word = curLetters.join("");
       
            // And see if it's in the dictionary
            if ( dict[ word ] ) {
                // If it is, return that word
                return word;
            }
     
            // Otherwise remove another letter from the end
            curLetters.pop();
        }
    }
    
    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    
    function STimer() {
        this.startTime;
        this.checks = [];
        this.counter = 0;
        this.endTime;
        
        this.start = function(){
            this.startTime = new Date().getTime();
            this.checks = [];
            return this;
        }
        
        this.stop = function(){
            this.endTime = new Date().getTime();
            return this;
        }
        
        this.addCheck = this.check = function(name){
            if(typeof name === "undefined"){
                name = this.counter;
                this.counter++;
            }
            this.checks.push({time: new Date().getTime(), name: name});
            return this;
        }
        
        this.getTime = function(){
            return this.endTime - this.startTime;
        }
        
        this.getDisplay = function(){
            var $table = $('<table>');
            var $row = $('<tr>').append($('<th>Name</th>')).append($('<th>Time Elapsed</th>'));
            if(this.checks.length > 0){
                $row.append($('<th>Time Taken</th>'));
            }
            var $head = $('<thead>').append($row);
            $table.append($head);
            $tbody = $('<tbody>');
            var $row = $('<tr>');
            $row.append($('<td>Start</td>')).append($('<td>0s</td>'));
            if(this.checks.length > 0){
                $row.append($('<td>' + ((this.checks[0].time - this.startTime)/1000) + 's</td>'));
            }
            $tbody.append($row);
            if(numProps(this.checks) > 0){
                for(i = 0; i < this.checks.length; i++){
                    var $row = $('<tr>');
                    $row.append(
                        $('<td>' + this.checks[i].name + '</td>')
                    ).append(
                        $('<td>' + ((this.checks[i].time - this.startTime)/1000) + 's</td>')
                    );
                    if(i == (this.checks.length-1)){
                        $row.append($('<td>' + ((this.endTime - this.checks[i].time)/1000) + 's</td>'));
                    } else {
                        $row.append($('<td>' + ((this.checks[i+1].time - this.checks[i].time)/1000) + 's</td>'));
                    }
                    $tbody.append($row);
                }
            }
            var $row = $('<tr>');
            $row.append($('<td>Stop</td>')).append($('<td>' + (this.endTime - this.startTime)/1000 + 's</td>'));
            if(this.checks.length > 0){
                $row.append($('<td>Done</td>'));
            }
            $tbody.append($row);
            $table.append($tbody);
            return $table;
        }
    }   
});


if (!Object.keys) {
    // http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
    var hasDontEnumBug = true,
        dontEnums = [
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "constructor"
        ],
        dontEnumsLength = dontEnums.length;

    for (var key in {"toString": null}) {
        hasDontEnumBug = false;
    }

    Object.keys = function keys(object) {

        if (
            (typeof object != "object" && typeof object != "function") ||
            object === null
        ) {
            throw new TypeError("Object.keys called on a non-object");
        }

        var keys = [];
        for (var name in object) {
            if (owns(object, name)) {
                keys.push(name);
            }
        }

        if (hasDontEnumBug) {
            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
                var dontEnum = dontEnums[i];
                if (owns(object, dontEnum)) {
                    keys.push(dontEnum);
                }
            }
        }
        return keys;
    };

}

if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(needle) {
        for(var i = 0; i < this.length; i++) {
            if(this[i] === needle) {
                return i;
            }
        }
        return -1;
    };
}