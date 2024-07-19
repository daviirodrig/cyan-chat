const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        index: './src/index.html', // Add other entries as needed
        v2: './src/v2/index.html' // Add other entries as needed
    },
    output: {
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true, // Ensure the output directory is cleaned on each build
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                use: ['html-loader']
            },
            {
                test: /\.(png|svg|jpg|gif|webp)$/,
                type: 'asset/resource'
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                type: 'asset/resource'
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: './src/index.html',
            filename: 'index.html',
            inject: true,
            minify: {
                removeComments: true,
                collapseWhitespace: true,
            },
            hash: true, // Append hash to scripts and CSS links in HTML
        }),
        new HtmlWebpackPlugin({
            template: './src/v2/index.html',
            filename: 'v2/index.html',
            inject: true,
            minify: {
                removeComments: true,
                collapseWhitespace: true,
            },
            hash: true, // Append hash to scripts and CSS links in HTML
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/styles', to: 'styles' },
                { from: 'src/v2/styles', to: 'v2/styles' },
                { from: 'src/fonts', to: '' }
            ]
        })
    ]
};
