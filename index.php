<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        
        <title>Bookworm Solver</title>
        <!--<link href='http://fonts.googleapis.com/css?family=Droid+Sans:400,700' rel='stylesheet' type='text/css'>-->
        <link href='bootstrap/css/bootstrap.min.css' rel='stylesheet' type='text/css'>
        <link href='css/style.css' rel='stylesheet' type='text/css'>
        
        <link rel="apple-touch-icon" sizes="57x57" href="apple-touch-icon-57x57.png">
        <link rel="apple-touch-icon" sizes="114x114" href="apple-touch-icon-114x114.png">
        <link rel="apple-touch-icon" sizes="72x72" href="apple-touch-icon-72x72.png">
        <link rel="apple-touch-icon" sizes="144x144" href="apple-touch-icon-144x144.png">
        <link rel="apple-touch-icon" sizes="60x60" href="apple-touch-icon-60x60.png">
        <link rel="apple-touch-icon" sizes="120x120" href="apple-touch-icon-120x120.png">
        <link rel="apple-touch-icon" sizes="76x76" href="apple-touch-icon-76x76.png">
        <link rel="apple-touch-icon" sizes="152x152" href="apple-touch-icon-152x152.png">
        
        <link rel="icon" type="image/png" href="favicon-196x196.png" sizes="196x196">
        <link rel="icon" type="image/png" href="favicon-160x160.png" sizes="160x160">
        <link rel="icon" type="image/png" href="favicon-96x96.png" sizes="96x96">
        <link rel="icon" type="image/png" href="favicon-16x16.png" sizes="16x16">
        <link rel="icon" type="image/png" href="favicon-32x32.png" sizes="32x32">
        
        <meta name="msapplication-TileColor" content="#da532c">
        <meta name="msapplication-TileImage" content="mstile-144x144.png">
    </head>
    <body>
        <div class="container">
            <div class="row">
                <div class="col-md-12">
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <h2>Input</h2>
                    <form id="controls" role="form" class="form-inline" method="POST" action="">
                        <div class="form-group">
                            <label>Game Level
                                <input type="text" class="form-control" id="level" name="level" placeholder="Game Level" value=1></input>
                            </label>
                            <button class="btn btn-success" id="go">Go</button>
                            <button class="btn btn-danger" id="clear">Clear</button>
                            <button class="btn btn-info" id="saveState">Save</button>
                            <button class="btn btn-info" id="loadState">Load</button>
                        </div>
                    </form>
                    <div id="game-container"></div>
                    <div class="row">
                        <div class="col-md-12">
                            <h1>Bookworm Solver</h1>
                            <p>Simply enter your letters into the grid above, not forgetting to enter your level number. To insert special tiles (green, gold, sapphire, diamond, fire) just put a number after the letter, corresponding to the list below:
                                <ol>
                                    <li>Green</li>
                                    <li>Gold</li>
                                    <li>Sapphire</li>
                                    <li>Damond</li>
                                    <li>Fire/Burning</li>
                                </ol>
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="row">
                        <div class="col-sm-12">
                            <h2  id="result-title">Result</h2>
                            <div id="result"></div>
                            <div id="time-taken"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <script type="text/javascript" src="js/jquery-2.1.0.min.js"></script>
        <script type="text/javascript" src="../js/jquery.ba-bbq.min.js"></script>
        <script type="text/javascript" src="bootstrap/js/bootstrap.min.js"></script>
        <script type="text/javascript" src="js/main.js"></script>
    </body>
</html>