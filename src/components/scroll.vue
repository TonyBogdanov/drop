<template>
    <div ref="scroll" :class="[ 'scroll', { scrollbar } ]">
        <slot/>
    </div>
</template>

<style lang="scss" scoped>
.scroll {
    min-height: 60px;
    max-height: 720px;
    overflow-x: hidden;
    overflow-y: auto;

    &.scrollbar {
        padding: 0 10px 0 0;
    }
}
</style>

<script>
export default {
    data() {
        return {
            scrollbar: false,
        };
    },

    methods: {
        update() {
            this.scrollbar = this.$refs.scroll.scrollHeight > this.$refs.scroll.offsetHeight;
            requestAnimationFrame( this.update.bind( this ) );
        },
    },

    mounted() {
        this.update();
    },
}
</script>
