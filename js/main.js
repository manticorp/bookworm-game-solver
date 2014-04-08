$(function(){    
    /**
     * This variable stores variables related to the bookworm
     * game itself, such as letter scores and level multipliers.
     *
     * bookworm.variants            is game board layouts in length of columns
     * bookworm.specialMultipliers  the extra points for bonus tiles
     * bookworm.charScors           scores for each letter
     * bookworm.charDots            the amount of dots to display next to char
     */
    var bookworm = {
        variants: {
            web:    [7,8,7,8,7,8,7],
            tiny:   [1,2,1],
            small:  [2,3,2],
            med:    [3,4,3,4,3]
        },
        specialMultipliers: {
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
        },
        charScores: {
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
        },
        charDots: {
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
        }
    };
    
    /**
     * A bunch of options and states.
     * 
     * timer                = STimer object (defined below)
     * level                = the game level
     * variant              = the game variant (see bookworm above)
     * dict                 = where the dictionary gets loaded, dict[word] = true;
     * mapped               = for speeding things up later, a map of all beginning
     *                        word fragments in the pattern:
     *                          
     *                          var string = "abc";
     *                          for(i = 0; i < string.length; i++){
     *                              mapped[string.substring(0,string.length-i)] = true;
     *                          }
     *
     * isOn                 = records if analysis is on or not
     */
    var options = {
        timer: new STimer(),
        level: 1,
        variant: "web",
        dict: {},
        mapped: {},
        isOn: false
    };
    
    var $board = $('<div>').attr('id','game-board');
    
    var $inputs = [];
    
    var minWordLength = 3;
    var maxWordLength = 10;
    
    var permaHighlight = false;
    var permaHighlighted = false;
     
    // Do a jQuery Ajax request for the text dictionary
    $.getJSON( "words.json", function( words ) {
        var ttimer = new STimer();
        ttimer.start("Processing Dictionary");
        ttimer.check("Starting...");
        // And add them as properties to the dictionary lookup
        // This will allow for fast lookups later
        for ( var i = 0; i < words.length; i++ ) {
            ttimer.addAverageStart("Processing word")
            options.dict[ words[i] ] = true;
            for(var j = 0; j < words[i].length; j++){
                options.mapped[words[i].substr(0,(words[i].length - j))] = true;
            }
            ttimer.addAverageStop("Processing word")
        }
        ttimer.stop();
        ttimer.consoleResults();
        // The game would start after the dictionary was loaded
        startGame();
    });
    
    $('#controls').submit(function(){
        return false;
    });
    
    $('#go').click(function(e){
        if(checkGameBoardIsFull()){
            // 
            $('#result').html('');
            $('#result-title').text('Result (working...)');
            loading.start();
            options.timer.start();
            options.level = $('#level').val() || 1;
            saveState();
            setTimeout(findWords, 10);
        } else {
            $('#result').html($('<p>Please complete the gameboard.</p>'));
            $('#result-title').text('Result');
            $('.game-cell-input').each(function(){
                if($(this).val() == ''){
                    $(this).addClass('unfilled');
                    var that = $(this);
                    setTimeout(function(){
                        that.removeClass('unfilled');
                    }, 1000);
                }
            });
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
        options.variant = state.variant || options.variant;
        makeGameBoard();
        loadState(); 
    }

    function saveState(){
        var grid = gridState();
        var state = {grid:grid};
        state.level = $('#level').val();
        state.variant = options.variant;
        $.bbq.pushState(state);
    }
    
    function loadState(){
        var state   = $.deparam.fragment();
        grid        = state.grid;
        
        if(typeof state.variant !== "undefined"){
            options.variant = state.variant;
        }
        
        if(typeof state.level !== "undefined"){
            options.level = state.level;
        } else {
            options.level = 1;
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
        
        $('#level').val(options.level);
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
        options.timer.consoleResults();
        // $('#time-taken').html('').append(options.timer.getDisplay());
        $('#result-title').html('Result <span class="small">(' + (options.timer.getElapsedTime()/1000) + 's)</span>');
    }
    
    function makeGameBoard()
    {
        if(typeof options.variant === "undefined") options.variant = "web";
        
        var $col;
        var $cell;
        var $input;
        var cellno = 1;
        
        for( var i = 0; i < bookworm.variants[options.variant].length; i++ )
        {
            var cellClass = (i%2 == 0) ? "odd" : "even";
            $col = $('<div class="game-col">').addClass(cellClass);
            $colArray = [];
            
            for( var j = 0; j < bookworm.variants[options.variant][i]; j++ )
            {
                $input = $('<input type="text" class="game-cell-input" data-num=' + cellno + ' data-col=' + i + ' data-row=' + j + '>');
                $input.change(inputChange);
                $input.keyup(inputKeyUp);
                
                $inputCont = $('<div class="game-cell-input-cont" data-num=' + cellno + ' data-col=' + i + ' data-row=' + j + '>').append($input);
                
                $cell = $('<div class="game-cell" data-num=' + cellno + ' data-col=' + i + ' data-row=' + j + '>').append($inputCont);
                $cell.hover(inputMouseEnter,inputMouseLeave);
                
                $inputs.push($input);
                $colArray.push($input);
                
                $col.append($cell);
                
                cellno++;
            }
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
        var query = '.game-cell-input[data-row="' + coords.row + '"][data-col="' + coords.col + '"]';
        return $(query).first();
        return $cols[coords.col][coords.row];
    }
    
    function getCellFromCoords(coords){
        
    }
    
    function inputMouseEnter(e){
        var row = parseInt($(this).data('row'));
        var col = parseInt($(this).data('col'));
        var neighbours = findNeighbours({row:row, col:col} );
        $.each(neighbours, function(index, coords){
            $input = getInputFromCoords(coords);
            $input.addClass('highlight');
        });
    }
    
    function inputMouseLeave(e){
        var row = parseInt($(this).data('row'));
        var col = parseInt($(this).data('col'));
        var neighbours = findNeighbours({row:row, col:col} );
        $.each(neighbours, function(index, coords){
            $input = getInputFromCoords(coords);
            $input.removeClass('highlight');
        });
    }
    
    function buildGrid(){
        var grid = {};
        var i = 0;
        var inputs = $('.game-cell-input');
        inputs.each(function(){
            if(!grid.hasOwnProperty($(this).data('col'))){
                grid[$(this).data('col')] = {};
            }
            if($(this).val() == "Q") {
                grid[$(this).data('col')][$(this).data('row')] = "QU";
            } else {
                grid[$(this).data('col')][$(this).data('row')] = $(this).val();
            }
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
        
        var score = bookworm.charDots[$input.val().toLowerCase()];
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
    
    function displayResults(results){
        $result = $('#result');
        $result.html('');
        options.timer.addCheck("Order Results By Score");
        var ordered = orderResultsByScore(results);
        
        options.timer.addCheck("Build Table");
        $table = $("<table id='results-table' class='table table-bordered table-condensed table-striped'></table>")
        .append("<thead><tr><th>Word</th><th>Score</th><th>Controls</th></thead>");
        
        var $tbody = $('<tbody>');
        for(l = (ordered.words.length-1); l >= 0; l--){
            var $trow = $('<tr>');
            $trow.data("used", ordered.useds[l]);
            $trow.hover(displayUsed, unDisplayUsed);
            
            // The word
            $trow.append($('<td>').append($("<a href='#' class='result-word'>" + buildColoredWord(ordered.useds[l]).html() + "</a>").data("used", ordered.useds[l])));
            // The score
            $trow.append('<td><span class="result-score">' + ordered.scores[l] + '</span>')
            
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
        options.timer.addCheck("Append Table to Result");
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
        
        if(typeof options.variant === "undefined") options.variant = "web";
        var colSizes = bookworm.variants[options.variant];
        for(var l = 0; l < colsUsed.length; l++){
            col = colsUsed[l];
            for(var row = (colSizes[col]); row > 0; row--){
                var $input = getInputFromCoords({row:row, col:col});
                if( typeof $input != "undefined" && $input.val() == ""){
                    $ninput = nextFilledInCol({row:row, col:col});
                    if($ninput !== false && typeof $ninput != "undefined"){
                        $input.val($ninput.val());
                        $input.data('special',$ninput.data('special'));
                        $ninput.val('');
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
            
            wordvalue = wordvalue + bookworm.charScores[letter]; 
            word  = word + letter;
            bonus = bonus + bookworm.specialMultipliers[special];
        });
        score = ((options.level + wordvalue) * (bonus + word.length)) * 10;
        return score;
    }
    
    // finds all words available to gameboard
    function findWords(){
        if(options.isOn == false){
            options.isOn = true;
            options.timer.check("Traverse Grid");
            result = traverseGrid();
            options.isOn = false;
            loading.stop();
            options.timer.check("Display Results");
            displayResults(result);
            options.timer.stop()
            displayTime();
        }
    }
    
    function traverseGrid(){
        options.grid = buildGrid();
        var finalResults = [];
        for(col = 0; col < bookworm.variants[options.variant].length; col ++){
            for(row = 0; row < bookworm.variants[options.variant][col]; row ++){
                // options.timer.check(options.grid[col][row]);
                var letter = options.grid[col][row];
                finalResults = recursiveAddAllNext( [{row:row,col:col}], {row:row,col:col}, letter, finalResults, 0 );
            }
        }
        return finalResults;
    }
    
    // result structure:
    // {
    //      used: [array of used cells],
    //      word: "the word"
    // }
    function recursiveAddAllNext(used, coords, word, results){
        if(isWord(word) && word.length >= minWordLength){
            results.push({used: used.slice(), word: word}); 
        }
        options.timer.addAverageStart("Find Next Inputs");
        var nextInputs = findNextInputs( used, coords );
        options.timer.addAverageStop("Find Next Inputs");
        if(nextInputs.length != 0 && word.length < maxWordLength) {
            for(var ni = 0; ni < nextInputs.length; ni++){
                var tempUsed = used.slice(); //copy used array
                tempUsed.push(nextInputs[ni]); // add current coords to tempUsed array
                var tempWord = word + nextInputs[ni].letter; // create a temporary word
                
                options.timer.addAverageStart("couldLeadToWords");
                var cltw = couldLeadToWords(tempWord);
                options.timer.addAverageStop("couldLeadToWords");
                if(cltw){
                    results = recursiveAddAllNext( tempUsed, nextInputs[ni], tempWord, results );
                }
            }
        }
        return results;
    }
    
    function findNeighbours( coords ){
        var grid = (typeof options.grid === "undefined") ? buildGrid() : options.grid;
        var col = coords.col;
        var row = coords.row;
        var result = [];
        for(var i = -1; i <= 1; i++){
            tempcol = col + i;
            if(typeof grid[tempcol] !== "undefined"){
                if( tempcol == col) {
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
                    temprow = row + j;
                    if(typeof grid[tempcol][temprow] !== "undefined"){
                        result.push({col:tempcol, row: temprow, letter: grid[tempcol][temprow]});
                    }
                }
            }
        }
        return result;
    }
    
    // returns list of next inputs possible from input
    function findNextInputs( used, coords ){
        var neighbours = findNeighbours( coords );
        var result = [];
        var isUsed;
        var x = neighbours.length-1;
        do { 
            isUsed = (neighbours[x].row == coords.row && neighbours[x].col == coords.col);
            if(!isUsed){
                var y = used.length-1;
                do {
                    if(used[y].row == neighbours[x].row && used[y].col == neighbours[x].col){
                        isUsed = true;
                        y = 0;
                    }
                } while( y-- );
            }
            if(!isUsed) result.push(neighbours[x]);
        } while( x-- );
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
        return !!options.mapped[str.toLowerCase()];
    }
    
    function leadsToWords( str ){
        results = [];
        if(str == "") return results;
        str = str.toLowerCase();
        $.each(options.dict, function(key, val){
            if(key.substr(0,str.length) == str){
                results.push(key);
            }
        });
        return results;
    }
    
    function isWord(word){
        return !!(options.dict[word.toLowerCase()]);
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
            if ( options.dict[ word ] ) {
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
        this.name = this.defaultName = "Timer Results";
        this.startTime;
        this.checks = [];
        this.ccounter = 0;
        this.averages = {};
        this.acounter = 0;
        this.endTime;
        this.cd = {
            hpadding: 1,
            vpadding: 0,
            titleColor: "#faa",
            titleBackground: "#333"
        };
        
        this.start = function( name ){
            this.name = name || this.defaultName;
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
                name = this.ccounter;
                this.ccounter++;
            }
            this.checks.push({time: new Date().getTime(), name: name});
            return this;
        }
        
        this.addAverage = function(name){
            if(typeof name === "undefined"){
                name = this.acounter;
                this.acounter++;
            }
            this.averages[name] = {starts: [], stops: [], count: 0};
        }
        
        this.averageStart = this.addAverageStart = function(name){
            if(!this.averages.hasOwnProperty(name)){
                if(typeof name === "undefined"){
                    name = this.acounter;
                    this.acounter++;
                }
                this.averages[name] = {starts: [], stops: [], count: 0};
            }
            this.averages[name].starts.push(new Date().getTime());
            if((this.averages[name].starts.length - this.averages[name].stops.length) == 2){
                this.averages[name].stops.push(new Date().getTime());
            }
        }
        
        this.averageStop = this.addAverageStop = function(name){
            if(this.averages.hasOwnProperty(name)){
                this.averages[name].stops.push(new Date().getTime());
            } else {
                console.log("No average named: " + name);
            }
        }
        
        this.getTime = this.getElapsedTime = function(){
            return this.endTime - this.startTime;
        }
        
        this.consoleResults = function(){
            var str = "";
            var line = "";
            var longestName = "Averages";
            var longestResult = "0";
            
            // Find the longest name (leftmost column)
            for(var i = 0; i < this.checks.length; i++){
                if(this.checks[i].name.length > longestName.length) longestName = this.checks[i].name;
            }
            $.each(this.averages, function(name, values){
                if(name.length > longestName.length) longestName = name;
            });
            var longests = [longestName, "a".repeat(15), "a".repeat(15), "a".repeat(15)];
            
            // the title of the timings...
            console.log("%c~~~~~~+  " + this.name + "  +~~~~~~", "color:" + this.cd.titleColor + ";font-size: 2em; font-weight:900;background: " + this.cd.titleBackground + ";");
            
            // Row Headers
            var vals = ["Name", "Time Elapsed", "Time Taken", "% of Total"];
            var line = this.displayConsoleRow(vals, longests, true, true);
            str = str + line;
            
            // Start
            if(this.checks.length > 0){
                var vals = ["Start", "0s", ((this.checks[0].time - this.startTime)/1000) + 's', (((this.checks[0].time - this.startTime)/(this.endTime-this.startTime))*100).toFixed(2) + "%"];
            } else {
                var vals = ["Start", "0s", ((this.endTime - this.startTime)/1000) + 's', (((this.endTime - this.startTime)/(this.endTime-this.startTime))*100).toFixed(2) + "%"];
            }
            var line = this.displayConsoleRow(vals, longests, false, false);
            str = str + line;
            
            // Checks
            for(var j = 0; j < this.checks.length; j++){
                vals = [this.checks[j].name, (String(((this.checks[j].time - this.startTime)/1000).toPrecision(2))+"s")];
                if(j == (this.checks.length-1)){
                    var timeTaken = (this.endTime - this.checks[j].time);
                } else {
                    var timeTaken = (this.checks[j+1].time - this.checks[j].time);
                }
                vals.push((timeTaken/1000).toPrecision(2) + "s");
                vals.push(((timeTaken/(this.endTime - this.startTime))*100).toFixed(2) + '%');
                var line = this.displayConsoleRow(vals, longests, false, false);
                str = str + line;
            }
            
            // Done
            var vals = ["Stop", ((this.endTime - this.startTime)/1000) + 's', "Done", ""];
            var line = this.displayConsoleRow(vals, longests, false, false);
            str = str + line;
            
            // Averages
            str = str + this.consoleRow(["","","",""], longests);
            if(numProps(this.averages) > 0){
                var vals = ["Averages", "Avg", "Iters", "% of total"];
                var line = this.displayConsoleRow(vals, longests, true, true);
                str = str + line;
                var that = this;
                $.each(this.averages, function(name, values){
                    var vals = [];
                    var average = 0;
                    for(i = 0; i < values.starts.length; i++){
                        average = average + (values.stops[i] - values.starts[i]);
                    }
                    average = average/(values.starts.length);
                    vals = [
                        name, 
                        String((average/1000).toPrecision(3)) + 's', 
                        String(values.starts.length), 
                        String((((average * values.starts.length)/(that.endTime - that.startTime))*100).toFixed(2)) + '%'
                    ];
                    var line = that.displayConsoleRow(vals, longests, false, false);
                    str = str + line;
                });
            }
            // bottom border
            var line = this.consoleRow(vals, longests, false, false);
            // console.log("-".repeat(line.length));
            str = str + "-".repeat(line.length);
            // console.log(str);
            return str;
        }
        
        this.displayConsoleRow = function(vals, longests, center, title){
            center = !!center;
            title = !!title;
            
            var str = "|";
            for(var i = 0; i < vals.length; i++){
                if(center){
                    if((longests[i].length - vals[i].length) % 2 == 0){
                        lpad = rpad = (longests[i].length - vals[i].length)/2;
                    } else {
                        lpad = ((longests[i].length - vals[i].length)-1)/2;
                        rpad = ((longests[i].length - vals[i].length)+1)/2;
                    }
                    str = str + " ".repeat(this.cd.hpadding) + " ".repeat(lpad) + vals[i] + " ".repeat(rpad) + " ".repeat(this.cd.hpadding) + "|";
                } else {
                    str = str + " ".repeat(this.cd.hpadding) + vals[i] + " ".repeat(longests[i].length - vals[i].length) + " ".repeat(this.cd.hpadding) + "|";
                }
            }
            console.log("-".repeat(str.length));
            if(title){
                this.colorTrace(str, this.cd.titleColor);
            } else {
                console.log(str);
            }
            str = "-".repeat(str.length) + "\n" + str + "\n";
            return str;
        }
        
        this.consoleRow = function(vals, longests, center){
            center = !!center;
            var str = "|";
            for(var i = 0; i < vals.length; i++){
                if(center){
                    if((longests[i].length - vals[i].length) % 2 == 0){
                        lpad = rpad = (longests[i].length - vals[i].length)/2;
                    } else {
                        lpad = ((longests[i].length - vals[i].length)-1)/2;
                        rpad = ((longests[i].length - vals[i].length)+1)/2;
                    }
                    str = str + " ".repeat(this.cd.hpadding) + " ".repeat(lpad) + vals[i] + " ".repeat(rpad) + " ".repeat(this.cd.hpadding) + "|";
                } else {
                    str = str + " ".repeat(this.cd.hpadding) + vals[i] + " ".repeat(longests[i].length - vals[i].length) + " ".repeat(this.cd.hpadding) + "|";
                }
            }
            str = "-".repeat(str.length) + "\n" + str + "\n";
            return str;
        }
        
        this.colorTrace = function(msg, color) {
            console.log("%c" + msg, "color:" + color + ";font-weight:900;background: " + this.cd.titleBackground + ";");
        }
        
        this.getDisplay = function(){
            this.consoleResults();
            var $table = $('<table class="table">');
            $table.append('<thead><tr><th>Name</th><th>Time Elapsed</th><th>Time Taken</th><th>% of total</th></tr></thead>');
            $tbody = $('<tbody>');
            var $row = $('<tr>');
            $row.append($('<td>Start</td>')).append($('<td>0s</td>'));
            if(this.checks.length > 0){
                $row.append($('<td>' + ((this.checks[0].time - this.startTime)/1000) + 's</td>'));
                $row.append($('<td>' + (((this.checks[0].time - this.startTime)/(this.endTime-this.startTime))*100).toFixed(2) + '%</td>'));
            }
            $tbody.append($row);
            if(this.checks.length > 0){
                var $row = $('<tr>').append($('<th colspan="4">Checks</th>'));
                $tbody.append($row);
                for(i = 0; i < this.checks.length; i++){
                    var $row = $('<tr>');
                    $row.append('<td>' + this.checks[i].name + '</td><td>' + ((this.checks[i].time - this.startTime)/1000) + 's</td>');
                    if(i == (this.checks.length-1)){
                        var timeTaken = (this.endTime - this.checks[i].time);
                    } else {
                        var timeTaken = (this.checks[i+1].time - this.checks[i].time);
                    }
                    $row.append('<td>' + (timeTaken/1000) + 's</td>');
                    $row.append('<td>' + ((timeTaken/(this.endTime - this.startTime))*100).toFixed(2) + '%</td>');
                    $tbody.append($row);
                }
            }
            var $row = $('<tr>');
            $row.append($('<td>Stop</td>')).append($('<td>' + (this.endTime - this.startTime)/1000 + 's</td>'));
            if(this.checks.length > 0){
                $row.append($('<td colspan="2">Done</td>'));
            }
            $tbody.append($row);
            if(numProps(this.averages) > 0){
                $tbody.append($('<tr>').append($('<th>Averages</th><th>Avg</th><th>Iters</th><th>% of total</th>')));
                var that = this;
                $.each(this.averages, function(name, values){
                    var $row = $('<tr>');
                    
                    var average = 0;
                    for(i = 0; i < values.starts.length; i++){
                        average = average + (values.stops[i] - values.starts[i]);
                    }
                    average = average/(values.starts.length);
                    
                    $row.append(
                        $('<td>' + name + '</td>')
                    );
                    $row.append($('<td>' + (average/1000).toPrecision(3) + 's</td>'));
                    $row.append($('<td>' + values.starts.length + '</td>'));
                    $row.append($('<td>' + (((average*values.starts.length)/(that.endTime - that.startTime))*100).toFixed(2) + '%</td>'));
                    $tbody.append($row);
                });
            }
            $table.append($tbody);
            return $table;
        }
    }
    
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

String.prototype.repeat = function( num )
{
    return new Array( num + 1 ).join( this );
}