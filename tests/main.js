$(function(){
    var firstFirstLetters = {};
    var lastFirstLetters = {};
    var words = [];

    var shortNearA = "ate";
    var longNearA  = "atheistically";
    var shortNearZ = "zoo";
    var longNearZ  = "zoogeography";    
     
    // Do a jQuery Ajax request for the text dictionary
    $.get( "words.txt", function( txt ) {
        // Get an array of all the words
        words = txt.split( "\n" );
     
        // And add them as properties to the dictionary lookup
        // This will allow for fast lookups later
    
        for(var q = 0; q < words.length; q++){
            if(!firstFirstLetters.hasOwnProperty(words[q][0])){
                 firstFirstLetters[words[q][0]]= q;
            }
            lastFirstLetters[words[q][0]] = q;
        }
        
        // Start testing...!
    });
    $('#go').click(function(){
        startTests();
    });
    
    function startTests() {
        console.log("Starting testing");
        var suite = new Benchmark.Suite;
        suite.add('All, Long near A', function(){
            loopOverEveryElement( longNearA );
        });
        suite.add('All, Long near Z', function(){
            loopOverEveryElement( longNearZ );
        });
        suite.add('All, Short near A', function(){
            loopOverEveryElement( shortNearA );
        });
        suite.add('All, Short near Z', function(){
            loopOverEveryElement( shortNearZ );
        });
        suite.add('Segment, Long near A', function(){
            loopOverSegment( longNearA );
        });
        suite.add('Segment, Long near Z', function(){
            loopOverSegment( longNearZ );
        });
        suite.add('Segment, Short near A', function(){
            loopOverSegment( shortNearA );
        });
        suite.add('Segment, Short near Z', function(){
            loopOverSegment( shortNearZ );
        });
        suite.on('complete',function(e){
            // $('#results').html("<tr><td>" + this.join("</td></tr><tr><td>") + "</td></tr>");
            $('#results').html('<thead><tr><th>Name</th><th>Ops/sec</th><th>Deviation</th><th>Samples</th></tr></thead>');
            sorted = this.sort(function(a, b) {
                a = a.stats; b = b.stats;
                return (a.mean + a.moe > b.mean + b.moe ? 1 : -1);
            });
            sorted.forEach(function(a, b, c){
                console.log(a);
                $row = $('<tr>');
                $row.append('<td>'+ a.name +'</td>');
                $row.append('<td>'+ a.hz.toFixed(0) +'</td>');
                $row.append('<td>±'+ a.stats.rme.toFixed(2) +'%</td>');
                $row.append('<td>'+ a.stats.sample.length +'</td>');
                $('#results').append($row);
            });
            $('#result').html('Fastest is ' + this.filter('fastest').pluck('name') + ' and slowest is ' + this.filter('slowest').pluck('name'));
        });
        suite.run();
    }
    
    function loopOverEveryElement( string ){
        for(var i = 0; i < words.length; i++){
            if(words[i].substr(0,string.length) === string) return true;
        }
        return false;
    }

    function loopOverSegment( string ){
        var start = firstFirstLetters[string[0]];
        var end = lastFirstLetters[string[0]];
        for(var j = start; j < end; j++){
            if(words[j].substr(0,string.length) === string) return true;
        }
        return false;
    }
});