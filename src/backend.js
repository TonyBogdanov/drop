import express from 'express';
import fileUpload from 'express-fileupload';
import bodyParser from 'body-parser';
import ViteExpress from 'vite-express';
import { createReadStream } from 'node:fs';
import { basename, resolve } from 'node:path';
import { readdir, stat, unlink } from 'node:fs/promises';

const app = express();

app.use( fileUpload( {} ) );
app.use( bodyParser.json() );

function catchErrors( fn ) {
    return async ( req, res ) => {
        console.log( req.method, req.url );

        try {
            await fn( req, res );
        } catch ( err ) {
            console.error( err );

            res.status( 500 ).json( {
                status: 'error',
                message: err.message,
            } );
        }
    };
}

app.get( '/files', catchErrors( async ( req, res ) => {
    const names = ( await readdir( './data' ) ).filter( name => '.gitkeep' !== name );
    const stats = await Promise.all( names.map( name => stat( resolve( './data', name ) ) ) );

    const files = names.map( ( name, i ) => ( { name, size: stats[ i ].size, progress: 1 } ) );
    files.sort( ( { name: a }, { name: b } ) => a.localeCompare( b ) );

    res.setHeader( 'Content-Type', 'application/json' );
    res.send( JSON.stringify( files ) );
} ) );

app.get( '/download', catchErrors( async ( req, res ) => {
    if ( !req.query || !req.query.name ) {
        throw new Error( 'Missing file name.' );
    }

    const path = resolve( './data', req.query.name );
    const stats = await stat( path ); // verify file exists

    res.setHeader( 'Content-Disposition', `attachment; filename=${ req.query.name }` );
    res.setHeader( 'Content-Type', 'application/octet-stream' );
    res.setHeader( 'Content-Length', stats.size );

    createReadStream( path ).pipe( res );
} ) );

app.post( '/upload', catchErrors( ( req, res ) => {
    if ( !req.files || !req.files.file ) {
        throw new Error( 'Missing files.' );
    }

    req.files.file.mv( resolve( './data', basename( req.files.file.name ) ) );
    res.send( '' );
} ) );

app.post( '/remove', catchErrors( async ( req, res ) => {
    if ( !req.body || !req.body.names || !Array.isArray( req.body.names ) || 0 === req.body.names.length ) {
        throw new Error( 'Missing names.' );
    }

    await Promise.all( req.body.names.map( name => unlink( resolve( './data', basename( name ) ) ) ) );
    res.send( '' );
} ) );

ViteExpress.listen( app, 3000 );
