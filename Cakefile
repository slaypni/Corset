{spawn} = require 'child_process'

task 'build', '', ->
    coffee = spawn 'coffee', ['-c', '-o', './app', './src']
    coffee.stderr.on 'data', (data) ->
        process.stderr.write data.toString()
    coffee.stdout.on 'data', (data) ->
        process.stdout.write data.toString()
