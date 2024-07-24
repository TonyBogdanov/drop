<template>
    <main>
        <dropbox :open="0 === files.length" @upload="upload">
            <scroll>
                <file
                    :key="file.name"
                    :file="file"
                    :selected="selected.includes( file.name )"
                    @select="toggleSelect( file.name )"
                    v-for="file in files"/>
            </scroll>
        </dropbox>
    </main>

    <div class="manual">
        <input type="file" multiple @change="onBrowse"/>
        <div>Browse</div>
    </div>

    <div class="selection" :style="selectionStyle"/>
</template>

<style lang="scss" scoped>
.manual {
    position: relative;
    width: 96px;
    height: 32px;
    margin: 20px auto 0 auto;

    & > input,
    & > div {
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }

    & > input {
        opacity: 0;
        cursor: default;
    }

    & > div {
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 13px;
        font-weight: 500;
        text-transform: uppercase;
        color: #fff;
        background: linear-gradient(to bottom, #2a93e1, #2681C7);
        border-radius: 4px;
        pointer-events: none;
        box-shadow: inset 0 1px #2a93e1, inset 0 2px rgba(255, 255, 255, 0.25);
    }
}

.selection {
    position: absolute;
    border-radius: 4px;
    border: rgba(138, 138, 138, 0.65) 1px solid;
    background: rgba(138, 138, 138, 0.35);
    pointer-events: none;
    transition: opacity 0.2s ease-in-out;
    backdrop-filter: blur(10px);
}
</style>

<script>
import axios from 'axios';

import Dropbox from '@/components/dropbox.vue';
import File from '@/components/file.vue';
import Scroll from '@/components/scroll.vue';

export default {
    components: { Scroll, File, Dropbox },

    data() {
        return {
            files: [],
            manuallySelected: [],
            selection: { active: false, start: null, end: null },
        };
    },

    computed: {
        selectionStartEnd() {
            return [
                this.selection.start?.[ 0 ] ?? 0,
                this.selection.start?.[ 1 ] ?? 0,
                this.selection.end?.[ 0 ] ?? 0,
                this.selection.end?.[ 1 ] ?? 0,
            ];
        },

        selectionMinMax() {
            const [ startX, startY, endX, endY ] = this.selectionStartEnd;
            return [
                Math.min( startX, endX ),
                Math.min( startY, endY ),
                Math.max( startX, endX ),
                Math.max( startY, endY ),
            ];
        },

        selectionStyle() {
            const [ minX, minY, maxX, maxY ] = this.selectionMinMax;

            const left = minX + 'px';
            const top = minY + 'px';
            const width = ( maxX - minX ) + 'px';
            const height = ( maxY - minY ) + 'px';

            return { left, top, width, height, opacity: this.selection.active ? 1 : 0 };
        },

        selectionSelected() {
            if ( !this.selection.active ) {
                return [];
            }

            const [ minX, minY, maxX, maxY ] = this.selectionMinMax;
            return this.files.filter( ( _, i ) => {
                const el = document.querySelectorAll( '.file' )[ i ];
                if ( !el ) {
                    return false;
                }

                const { left, top, right, bottom } = el.getBoundingClientRect();
                return minX <= right && left <= maxX && minY <= bottom && top <= maxY;
            } ).map( ( { name } ) => name );
        },

        selected() {
            return this.manuallySelected.concat( this.selectionSelected ).filter( ( v, i, s ) => s.indexOf( v ) === i );
        },
    },

    methods: {
        onBrowse( e ) {
            for ( const file of e.target.files ) {
                this.upload( file );
            }
        },

        toggleSelect( name ) {
            if ( this.manuallySelected.includes( name ) ) {
                this.manuallySelected.splice( this.manuallySelected.indexOf( name ), 1 );
            } else {
                this.manuallySelected.push( name );
            }
        },

        toggleSelectAll() {
            const all = [ ...this.files.map( ( { name } ) => name ) ];
            this.manuallySelected = all.length === this.manuallySelected.length ? [] : all;
        },

        removeFile( file ) {
            const fileIndex = this.files.findIndex( ( { name } ) => name === file.name );
            const selectedIndex = this.manuallySelected.indexOf( file.name );

            0 <= fileIndex && this.files.splice( fileIndex, 1 );
            0 <= selectedIndex && this.manuallySelected.splice( selectedIndex, 1 );
        },

        pushFile( file ) {
            this.files.push( file );
            this.files.sort( ( { name: a }, { name: b } ) => a.localeCompare( b ) );
        },

        load() {
            axios.get( '/files' ).then( ( { data } ) => {
                this.files = data;
            } ).catch( this.handleError.bind( this ) );
        },

        upload( file ) {
            let item = {
                name: file.name,
                size: file.size,
                progress: 0,
            };

            this.removeFile( item );
            this.pushFile( item );

            item = this.files.find( ( { name } ) => name === file.name );

            const fd = new FormData();
            fd.set( 'file', file );

            axios.post( '/upload', fd, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: e => {
                    item.progress = e.loaded / ( e.total ?? Number.MAX_SAFE_INTEGER );
                },
            } ).then( () => {
                item.progress = 1;
            }, this.handleError.bind( this ) );
        },

        download() {
            for ( const name of this.manuallySelected ) {
                window.open( `/download?name=${ name }` );
            }

            this.manuallySelected = [];
        },

        remove() {
            const names = [ ...this.manuallySelected ];
            if ( 0 === names.length ) {
                return;
            }

            axios.post( '/remove', { names } ).then( () => {
                for ( const name of names ) {
                    this.removeFile( { name } );
                }
            } ).catch( this.handleError.bind( this ) );
        },

        handleError( err ) {
            console.error( err );
            alert( 'Something went wrong!' );
        },
    },

    mounted() {
        window.addEventListener( 'contextmenu', e => {
            e.preventDefault();
            this.download();
        } );

        window.addEventListener( 'keyup', e => {
            'delete' === e.code.toLowerCase() && this.remove();
            'enter' === e.code.toLowerCase() && this.download();
            'a' === e.key.toLowerCase() && e.ctrlKey && this.toggleSelectAll();
        } );

        window.addEventListener( 'mousedown', e => {
            e.preventDefault();

            this.selection.active = true;
            this.selection.start = [ e.clientX, e.clientY ];
            this.selection.end = [ e.clientX, e.clientY ];
        } );

        window.addEventListener( 'mouseup', e => {
            e.preventDefault();

            const [ x, y ] = this.selection.start;
            const selected = [ ...this.selected ];

            this.selection.active = false;
            if ( x === e.clientX && y === e.clientY ) {
                return;
            }

            this.manuallySelected = selected;
            this.selection.end = [ e.clientX, e.clientY ];
        } );

        window.addEventListener( 'mousemove', e => {
            e.preventDefault();
            this.selection.active && ( this.selection.end = [ e.clientX, e.clientY ] );
        } );

        this.load();
    },
}
</script>
