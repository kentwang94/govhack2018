from flask import Flask
from flask import request, jsonify
import json
import sys
import helper


app = Flask(__name__)

@app.route('/dialogflow')
def realtime_data():
    lat = request.args.get('endLatitude')
    lon = request.args.get('endLongitude')

    air_quality,res = helper.get_air_quality(lat,lon)

    car_park, vacant = helper.get_car_park(lat,lon)

    c_weather,score = helper.get_weather(lat, lon)

    return jsonify({'status':True, 'air_quality':air_quality,'air_q_level':res, 'car_park_status':car_park,'car_park_vacant_rate':vacant , 'weather':c_weather, 'weather_score':score})


if __name__=='__main__':
    argv = sys.argv
    if len(argv)<2:
        debug_mode = False
    else:
        debug_mode = bool(argv[1])

    app.run(host='0.0.0.0', port=16666, debug=debug_mode)
