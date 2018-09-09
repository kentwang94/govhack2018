import pandas as pd
import numpy as np
from datetime import datetime
import re
import urllib.request
import json
import pickle
from math import sin, cos, sqrt, atan2, radians
from weather import Weather,Unit
from geopy import distance
import pytz

CAR_PARK_RADIUS = 0.8

CAR_PARK_THRESHOLD = 0.4

tz = pytz.timezone('Australia/Melbourne')

def get_air_quality(lat, lon):
    air_url = 'http://sciwebsvc.epa.vic.gov.au/aqapi/SitesHourlyAirQuality?datetimestart='
    current_time = str(datetime.now(tz=tz))
    current_time = re.split('\-|\ |\:', current_time)
    current_time = ''.join(current_time[:4])
    air_url = air_url+current_time

    current_loc = [float(lat),float(lon)]

    with urllib.request.urlopen(air_url) as url:
        air_quality = json.loads(url.read().decode())

    sub = []
    for rec in air_quality['NonIncidentSites']:
        for mrec in rec['Measurements']:
            if mrec['TimeBasisID']=='1HR_AV':
                sub.append(mrec['Description'])

    with open('air_quality_dict.pickle','rb') as f:
        air_q_dict = pickle.load(f)

    loc = []
    airquality = []
    for rec in air_quality['NonIncidentSites']:
        loc.append([float(rec['Latitude']), float(rec['Longitude'])])
        sub = []
        for mrec in rec['Measurements']:
            if mrec['TimeBasisID']=='1HR_AV':
                if mrec['Description']:
                    sub.append(air_q_dict[mrec['Description']])
        airquality.append(sum(sub)/len(sub))
    assert len(loc)==len(airquality)

    nearest = np.inf
    res = np.inf

    for i,l in enumerate(loc):
        dist = np.linalg.norm(np.array(l)-np.array(current_loc))
        if dist<nearest:
            nearest = dist
            res = airquality[i]

    res = int(res)
    res_dict = {2:'Bad', 3:'Fair', 4:'Good', 5:'Very Good'}
    return res_dict[res],res/5

def get_car_park(lat, lon):
    parking_url = 'https://data.melbourne.vic.gov.au/resource/dtpv-d4pf.json'
    with urllib.request.urlopen(parking_url) as url:
        on_street_rt = json.loads(url.read().decode())

    loc = []
    status = []
    for rec in on_street_rt:
        t_lon,t_lat = rec['location']['coordinates']
        distance = get_distance(lat,lon,t_lat,t_lon)
        #print(distance)
        if distance<CAR_PARK_RADIUS:
            loc.append(distance)
            status.append(1 if rec['status']=='Unoccupied' else 0)

    if len(status)!=0:
        vacant = status.count(1)/len(status)
    else:
        vacant = 1
    if vacant<CAR_PARK_THRESHOLD:
        return 'Not enough car park', vacant
    else:
        return 'Enough car park', vacant

def get_weather(lat, lon):
    weather = Weather(Unit.CELSIUS)
    lookup = weather.lookup_by_latlng(lat,lon)
    condition = lookup.condition
    result = condition.text
    score = 1
    if 'rain' in result.lower():
        score = 0.2
    if 'snow' in result.lower():
        score = 0.1

    return condition.text, score


def get_distance(lat_1, lng_1, lat_2, lng_2):
    lat_1 = float(lat_1)
    lng_1 = float(lng_1)
    lat_2 = float(lat_2)
    lng_2 = float(lng_2)

    coor1 = (lat_1,lng_1)
    coor2 = (lat_2,lng_2)

    return distance.distance(coor1, coor2).km

