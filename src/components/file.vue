<template>
    <div
        :class="[ 'file', { selected, progressing: 0 < progress && 1 > progress } ]"
        @click.prevent="$emit( 'select' )">

        <div class="preview" :style="{ background }">
            {{ ext }}
        </div>

        <div class="name">
            {{ name }}
        </div>

        <div class="size">
            {{ size }}
        </div>

        <div class="progress">
            <div :style="{ width: ( 100 * progress ) + '%' }"/>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.file {
    position: relative;
    display: flex;
    align-items: center;
    height: 40px;
    color: #2b2b2b;
    padding: 10px;
    border-radius: 10px;
    transition: all 0.2s ease-in-out;
    overflow: hidden;

    & > .preview {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 53px;
        height: 40px;
        color: #fff;
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
        border-radius: 10px;
        margin: 0 10px 0 0;
    }

    & > .name {
        flex-grow: 1;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        margin: 0 10px 0 0;
    }

    & > .size {
        flex-shrink: 0;
        height: 20px;
        font-size: 12px;
        line-height: 20px;
        color: #fff;
        background: #b6bcbe;
        border-radius: 10px;
        padding: 0 8px;
    }

    & > .progress {
        position: absolute;
        left: 10px;
        right: 10px;
        bottom: 10px;
        height: 6px;
        border-radius: 3px;
        box-shadow: #fff 0 0 0 1px;
        background: #eee;
        transition: opacity 0.2s ease-in-out;

        & > div {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            border-radius: 3px;
            background: #7d858c;
            transition: width 0.2s ease-in-out;
        }
    }

    &.selected {
        &,
        &:hover {
            color: #fff;
            background: #2a93e1;
        }

        & + & {
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        }

        &:has(+ .selected) {
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        }
    }

    &.progressing {
        padding-bottom: 26px;
        background: #f8f8f8;
        pointer-events: none;
    }

    &:not(.progressing) > .progress {
        opacity: 0;
    }

    &:hover {
        background: #f8f8f8;
    }
}
</style>

<script>
import Color from 'color';

export default {
    emits: [ 'select' ],

    props: {
        file: Object,
        selected: Boolean,
    },

    computed: {
        name() {
            return this.file.name;
        },

        size() {
            const { size } = this.file;
            const i = 0 === size ? 0 : Math.floor( Math.log( size ) / Math.log( 1024 ) );

            return ( size / Math.pow( 1024, i ) ).toFixed( 2 ) + ' ' + [ 'B', 'kB', 'MB', 'GB', 'TB' ][ i ];
        },

        progress() {
            return this.file.progress;
        },

        ext() {
            const parts = this.name.split( '.' );
            return parts[ parts.length - 1 ].substring( 0, 4 );
        },

        background() {
            return Color( '#368fd7' ).rotate( ( this.ext.toLowerCase().charCodeAt( 0 ) - 97 ) * 360 / 26 )
                .darken( 0.2 ).saturate( 0.2 ).hex();
        },
    },
}
</script>
