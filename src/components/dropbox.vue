<template>
    <div :class="[ 'dropbox', { open: open || dragging } ]">
        <slot/>

        <div class="dropee">
            drop anywhere to upload
        </div>
    </div>
</template>

<style lang="scss" scoped>
.dropbox {
    position: relative;

    & > .dropee {
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        top: -10px;
        right: -10px;
        left: -10px;
        bottom: -10px;
        font-weight: 500;
        text-transform: uppercase;
        background: #dedede;
        transition: opacity 0.2s ease-in-out;
        pointer-events: none;

        &::after {
            content: '';
            display: block;
            position: absolute;
            top: 10px;
            right: 10px;
            bottom: 10px;
            left: 10px;
            border: #7f8588 2px dashed;
            border-radius: 10px;
        }
    }

    &:not(.open) > .dropee {
        opacity: 0;
    }
}
</style>

<script>
import pDefer from 'p-defer';

export default {
    emits: [ 'upload' ],

    props: {
        open: Boolean,
    },

    data() {
        return {
            dragging: false,
        };
    },

    methods: {
        async getFiles( e ) {
            if ( !e.dataTransfer ) {
                return [];
            }

            const list = e.dataTransfer?.items;
            const entries = [];

            for ( const item of list ) {
                const entry = item.webkitGetAsEntry();
                if ( !entry ) {
                    continue;
                }

                entries.push( entry );
            }

            return this.getFilesFromEntries( entries );
        },

        async getFilesFromEntries( entries ) {
            const result = [];
            for ( const key in entries ) {
                result.unshift( ...await this.traverseFileTree( entries[ key ] ) );
            }

            return result;
        },

        async traverseFileTree( entry ) {
            const deferred = pDefer();

            if ( entry.isFile ) {
                entry.file( file => deferred.resolve( [ file ] ) );
            } else if ( entry.isDirectory ) {
                const reader = entry.createReader();
                reader.readEntries( async entries => {
                    deferred.resolve( await this.getFilesFromEntries( entries ) );
                } );
            } else {
                deferred.resolve( [] );
            }

            return deferred.promise;
        },

        onDragEnter() {
            this.dragging = true;
        },

        onDragLeave( e ) {
            if ( null === e.relatedTarget ) {
                this.dragging = false;
            }
        },

        onDragOver( e ) {
            e.preventDefault();
        },

        onDrop( e ) {
            e.preventDefault();
            this.dragging = false;

            if ( !e.dataTransfer?.types.includes( 'Files' ) ) {
                return;
            }

            this.getFiles( e )
                .then( files => Promise.all( files.map( file => this.$emit( 'upload', file ) ) ) )
                .catch( this.$root.handleError.bind( this.$root ) );
        },
    },

    mounted() {
        window.addEventListener( 'dragenter', this.onDragEnter.bind( this ) );
        window.addEventListener( 'dragleave', this.onDragLeave.bind( this ) );
        window.addEventListener( 'dragover', this.onDragOver.bind( this ) );
        window.addEventListener( 'drop', this.onDrop.bind( this ) );
    },
}
</script>
